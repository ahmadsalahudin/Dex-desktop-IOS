import UIKit
import WebKit
import SafariServices

final class DesktopViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private var embeddedBrowser: WKWebView?
    private let browserContainer = UIView()

    override var prefersStatusBarHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .bottom }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .landscape }
    override var preferredInterfaceOrientationForPresentation: UIInterfaceOrientation { .landscapeRight }
    override var shouldAutorotate: Bool { true }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.07, green: 0.10, blue: 0.20, alpha: 1)
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
        browserContainer.clipsToBounds = true
        browserContainer.isHidden = true
        view.addSubview(browserContainer)
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

    private func createEmbeddedBrowser() -> WKWebView {
        if let existing = embeddedBrowser { return existing }
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.defaultWebpagePreferences.preferredContentMode = .desktop
        let browser = WKWebView(frame: .zero, configuration: config)
        browser.navigationDelegate = self
        browser.uiDelegate = self
        browserContainer.addSubview(browser)
        embeddedBrowser = browser
        return browser
    }

    private func handleBrowserAction(_ action: String, data: [String: Any]) {
        switch action {
        case "navigate":
            guard let raw = data["url"] as? String, let url = safeWebURL(raw) else { return }
            createEmbeddedBrowser().load(URLRequest(url: url))
        case "back": embeddedBrowser?.goBack()
        case "forward": embeddedBrowser?.goForward()
        case "reload": embeddedBrowser?.reload()
        case "hide": browserContainer.isHidden = true
        case "close":
            embeddedBrowser?.stopLoading()
            embeddedBrowser?.removeFromSuperview()
            embeddedBrowser = nil
            browserContainer.isHidden = true
        case "frame": updateBrowserFrame(data)
        default: break
        }
    }

    private func updateBrowserFrame(_ data: [String: Any]) {
        func number(_ key: String) -> CGFloat? {
            guard let value = data[key] as? NSNumber, value.doubleValue.isFinite else { return nil }
            return CGFloat(value.doubleValue)
        }
        guard let x=number("x"), let y=number("y"), let w=number("width"), let h=number("height"),
              let clipX=number("clipX"), let clipY=number("clipY"),
              let clipW=number("clipWidth"), let clipH=number("clipHeight"),
              w > 0, h > 0, clipW > 0, clipH > 0, let browser=embeddedBrowser else {
            browserContainer.isHidden = true
            return
        }
        let requested = CGRect(x:x, y:y, width:w, height:h)
        let workspace = CGRect(x:clipX, y:clipY, width:clipW, height:clipH)
        let visible = requested.intersection(workspace).intersection(view.bounds)
        guard !visible.isNull, !visible.isEmpty else { browserContainer.isHidden = true; return }
        browserContainer.frame = visible
        browser.frame = CGRect(x:requested.minX-visible.minX, y:requested.minY-visible.minY,
                               width:requested.width, height:requested.height)
        browserContainer.isHidden = false
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
        if webView === embeddedBrowser {
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

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = navigationAction.request.url, let safe = safeWebURL(url.absoluteString) else { return nil }
        if webView === embeddedBrowser { embeddedBrowser?.load(URLRequest(url: safe)) }
        else if navigationAction.navigationType == .linkActivated { showBrowser(safe) }
        return nil
    }
}
