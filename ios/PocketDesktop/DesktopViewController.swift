import UIKit
import WebKit
import SafariServices

// UIKit hit testing does not automatically follow a layer mask. Keep touches in
// the visible pieces of a browser pane so windows above it remain interactive.
private final class BrowserClipView: UIView {
    var visibleRegions: [CGRect] = []
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        super.point(inside: point, with: event) && visibleRegions.contains { $0.contains(point) }
    }
}

final class DesktopViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate, UIGestureRecognizerDelegate {
    private var webView: WKWebView!
    private var browsers: [String: WKWebView] = [:]
    private var browserContainers: [String: BrowserClipView] = [:]
    private var browserURLObservers: [ObjectIdentifier: NSKeyValueObservation] = [:]
    private var browserPopups: [String: [WKWebView]] = [:]
    private var keyboardIsHiding = false

    override var prefersStatusBarHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .bottom }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }
    override var shouldAutorotate: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.07, green: 0.10, blue: 0.20, alpha: 1)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide),
                                               name: UIResponder.keyboardWillHideNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardDidHide),
                                               name: UIResponder.keyboardDidHideNotification, object: nil)
        let content = WKUserContentController()
        content.add(self, name: "openExternal")
        content.add(self, name: "nativeBrowser")
        let config = WKWebViewConfiguration()
        config.userContentController = content
        config.websiteDataStore = .default()
        webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        // The desktop handles safe-area spacing in CSS; do not inset the whole viewport twice.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        guard let folder = Bundle.main.url(forResource: "app", withExtension: nil),
              let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "app") else {
            let label = UILabel()
            label.text = "The desktop files could not be found. Check that the app folder is included in the Xcode target."
            label.textColor = .white
            label.textAlignment = .center
            label.numberOfLines = 0
            label.translatesAutoresizingMaskIntoConstraints = false
            view.addSubview(label)
            NSLayoutConstraint.activate([label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
                                         label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
                                         label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24)])
            return
        }
        webView.loadFileURL(index, allowingReadAccessTo: folder)
    }

    @objc private func keyboardWillHide() {
        // The desktop web view can move during keyboard dismissal. Do not show
        // a page at coordinates measured before the transition has finished.
        keyboardIsHiding = true
        hideBrowserContainers()
    }

    @objc private func keyboardDidHide() {
        keyboardIsHiding = false
        webView.evaluateJavaScript("window.dispatchEvent(new Event('pocketdesktop:keyboard-hidden'))")
    }

    // Only the bundled desktop's main frame can invoke these native operations.
    // The separate browser view has no script bridge installed.
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true else { return }
        if message.name == "openExternal", let raw = message.body as? String, let url = safeWebURL(raw) {
            showBrowser(url)
        } else if message.name == "nativeBrowser", let data = message.body as? [String: Any],
                  let action = data["action"] as? String {
            handleBrowserAction(action, data: data)
        }
    }

    private func validBrowserID(_ raw: Any?) -> String? {
        guard let id = raw as? String, !id.isEmpty, id.count <= 64 else { return nil }
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "_-"))
        return id.unicodeScalars.allSatisfy { allowed.contains($0) } ? id : nil
    }

    private func createEmbeddedBrowser(_ id: String) -> WKWebView {
        if let existing = browsers[id] { return existing }
        let config = WKWebViewConfiguration()
        // Each pane uses the same persistent store; sites still control expiry
        // and whether their authentication flows permit in-app browsers.
        config.websiteDataStore = .default()
        config.defaultWebpagePreferences.preferredContentMode = .desktop
        let browser = WKWebView(frame: .zero, configuration: config)
        browser.accessibilityIdentifier = "webview-" + id
        browser.navigationDelegate = self
        browser.uiDelegate = self
        let container = BrowserClipView()
        container.clipsToBounds = true
        container.isHidden = true
        let focus = UITapGestureRecognizer(target: self, action: #selector(browserWasTapped(_:)))
        focus.cancelsTouchesInView = false
        focus.delegate = self
        container.addGestureRecognizer(focus)
        container.addSubview(browser)
        view.addSubview(container)
        browsers[id] = browser
        browserContainers[id] = container
        observeURL(browser, id: id)
        return browser
    }

    private func ownerID(of browser: WKWebView) -> String? {
        if let root = browsers.first(where: { $0.value === browser }) { return root.key }
        return browserPopups.first(where: { $0.value.contains(where: { $0 === browser }) })?.key
    }

    private func activeBrowser(_ id: String) -> WKWebView? {
        browserPopups[id]?.last ?? browsers[id]
    }

    private func observeURL(_ browser: WKWebView, id: String) {
        browserURLObservers[ObjectIdentifier(browser)] = browser.observe(\.url, options: [.new]) { [weak self] observed, _ in
            DispatchQueue.main.async { [weak self, weak observed] in
                guard let self = self, let observed = observed, self.activeBrowser(id) === observed else { return }
                self.announceURL(observed, id: id)
            }
        }
    }

    private func announceURL(_ browser: WKWebView, id: String) {
        guard let url = browser.url, safeWebURL(url.absoluteString) != nil else { return }
        sendDesktopEvent("pocketdesktop:browser-url", detail: ["id": id, "url": url.absoluteString])
    }

    private func sendDesktopEvent(_ name: String, detail: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: detail),
              let encoded = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('\(name)',{detail:\(encoded)}))")
    }

    private func focusBrowser(_ container: UIView?) {
        guard let id = browserContainers.first(where: { $0.value === container })?.key,
              let data = try? JSONSerialization.data(withJSONObject: [id]),
              let encoded = String(data: data, encoding: .utf8) else { return }
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('pocketdesktop:browser-focus',{detail:\(encoded)[0]}))")
    }

    @objc private func browserWasTapped(_ gesture: UITapGestureRecognizer) {
        if gesture.state == .ended { focusBrowser(gesture.view) }
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        // A scroll cancels a tap recognizer, so focus as soon as a touch starts.
        // The recognizer does not cancel or delay delivery to the web page.
        focusBrowser(gestureRecognizer.view)
        return true
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool { true }

    private func hideBrowserContainers() {
        for container in browserContainers.values { container.isHidden = true }
    }

    private func handleBrowserAction(_ action: String, data: [String: Any]) {
        if action == "sync" { syncBrowsers(data["views"] as? [[String: Any]] ?? []); return }
        guard let id = validBrowserID(data["id"]) else { return }
        switch action {
        case "navigate":
            guard let raw = data["url"] as? String, let url = safeWebURL(raw) else { return }
            let browser = activeBrowser(id) ?? createEmbeddedBrowser(id)
            browser.load(URLRequest(url: url))
        case "back": activeBrowser(id)?.goBack()
        case "forward": activeBrowser(id)?.goForward()
        case "reload": activeBrowser(id)?.reload()
        case "close-popup":
            if let popup = browserPopups[id]?.last { removePopup(popup, id: id) }
        case "close":
            let panes = (browserPopups.removeValue(forKey: id) ?? []) + (browsers[id].map { [$0] } ?? [])
            for pane in panes {
                browserURLObservers.removeValue(forKey: ObjectIdentifier(pane))
                pane.stopLoading()
                pane.removeFromSuperview()
            }
            browsers.removeValue(forKey: id)
            browserContainers[id]?.removeFromSuperview()
            browserContainers.removeValue(forKey: id)
        default: break
        }
    }

    private func rect(_ data: [String: Any]) -> CGRect? {
        func number(_ key: String) -> CGFloat? {
            guard let value = data[key] as? NSNumber, value.doubleValue.isFinite else { return nil }
            return CGFloat(value.doubleValue)
        }
        guard let x = number("x"), let y = number("y"),
              let width = number("width"), let height = number("height"),
              width > 0, height > 0 else { return nil }
        return CGRect(x: x, y: y, width: width, height: height)
    }

    private func syncBrowsers(_ specs: [[String: Any]]) {
        guard !keyboardIsHiding else { hideBrowserContainers(); return }
        var visible = Set<String>()
        // Specs arrive in desktop z-order. The desktop computes non-overlapping
        // visible regions after subtracting higher windows and the workspace edge.
        for spec in specs {
            guard let id = validBrowserID(spec["id"]), let browser = browsers[id],
                  let container = browserContainers[id], let requested = rect(spec),
                  let rawRegions = spec["regions"] as? [[String: Any]] else { continue }
            let frame = requested.intersection(view.bounds)
            guard !frame.isNull, !frame.isEmpty else { continue }
            var localRegions: [CGRect] = []
            let path = UIBezierPath()
            for raw in rawRegions.prefix(256) {
                guard let region = rect(raw) else { continue }
                let clipped = region.intersection(frame)
                guard !clipped.isNull, !clipped.isEmpty else { continue }
                let local = clipped.offsetBy(dx: -frame.minX, dy: -frame.minY)
                localRegions.append(local)
                path.append(UIBezierPath(rect: local))
            }
            guard !localRegions.isEmpty else { continue }
            container.frame = frame
            let paneFrame = CGRect(x: requested.minX-frame.minX, y: requested.minY-frame.minY,
                                   width: requested.width, height: requested.height)
            browser.frame = paneFrame
            for popup in browserPopups[id] ?? [] { popup.frame = paneFrame }
            container.visibleRegions = localRegions
            let mask = CAShapeLayer()
            mask.frame = container.bounds
            mask.path = path.cgPath
            mask.fillColor = UIColor.black.cgColor
            container.layer.mask = mask
            container.isHidden = false
            visible.insert(id)
            view.bringSubviewToFront(container)
        }
        for (id, container) in browserContainers where !visible.contains(id) { container.isHidden = true }
    }

    private func safeWebURL(_ raw: String) -> URL? {
        guard let components = URLComponents(string: raw),
              let scheme = components.scheme?.lowercased(),
              ["http", "https"].contains(scheme), components.host != nil,
              let url = components.url else { return nil }
        return url
    }

    private func showBrowser(_ url: URL) {
        guard presentedViewController == nil else { return }
        present(SFSafariViewController(url: url), animated: true)
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if ownerID(of: webView) != nil {
            let scheme = url.scheme?.lowercased() ?? ""
            if safeWebURL(url.absoluteString) != nil || ["about", "blob", "data"].contains(scheme) {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
            }
            return
        }
        guard navigationAction.targetFrame?.isMainFrame != false else { decisionHandler(.allow); return }
        if url.isFileURL || url.absoluteString == "about:blank" { decisionHandler(.allow); return }
        if navigationAction.navigationType == .linkActivated, let safe = safeWebURL(url.absoluteString) { showBrowser(safe) }
        decisionHandler(.cancel)
    }

    private func removePopup(_ popup: WKWebView, id: String) {
        guard var stack = browserPopups[id], let index = stack.firstIndex(where: { $0 === popup }) else { return }
        stack.remove(at: index)
        browserURLObservers.removeValue(forKey: ObjectIdentifier(popup))
        popup.stopLoading()
        popup.removeFromSuperview()
        browserPopups[id] = stack
        sendDesktopEvent("pocketdesktop:browser-popup", detail: ["id": id, "open": !stack.isEmpty])
        if let active = activeBrowser(id) { announceURL(active, id: id) }
    }

    func webViewDidClose(_ webView: WKWebView) {
        if let id = ownerID(of: webView) { removePopup(webView, id: id) }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let id = ownerID(of: webView) {
            guard (browserPopups[id]?.count ?? 0) < 3, let container = browserContainers[id] else { return nil }
            // WebKit requires this exact configuration to preserve window.opener.
            let popup = WKWebView(frame: webView.frame, configuration: configuration)
            popup.navigationDelegate = self
            popup.uiDelegate = self
            popup.accessibilityIdentifier = "popup-" + id
            container.addSubview(popup)
            browserPopups[id, default: []].append(popup)
            observeURL(popup, id: id)
            sendDesktopEvent("pocketdesktop:browser-popup", detail: ["id": id, "open": true])
            return popup
        }
        guard let url = navigationAction.request.url, let safe = safeWebURL(url.absoluteString) else { return nil }
        if navigationAction.navigationType == .linkActivated { showBrowser(safe) }
        return nil
    }
}
