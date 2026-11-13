#!/usr/bin/env python3
"""Exercise the pinned launcher's actual closeWindow method against host mocks.

The fixture intercepts process signals; no other process can be signalled.
This is a macOS-only unit test, not a test of the private iOS scene manager.
"""
import argparse
from pathlib import Path
import subprocess
import tempfile


def extract_method(source: str) -> str:
    marker = "- (void)closeWindow {"
    start = source.index(marker)
    opening = source.index("{", start)
    depth = 1
    cursor = opening + 1
    while depth:
        if cursor >= len(source):
            raise ValueError("unclosed closeWindow method")
        depth += (source[cursor] == "{") - (source[cursor] == "}")
        cursor += 1
    return source[start:cursor]


FIXTURE = r'''
#import <Foundation/Foundation.h>
#import <signal.h>

static int signalCount = 0;
static int simulated_kill(pid_t pid, int signalNumber) {
    (void)pid; (void)signalNumber;
    signalCount++;
    return 0;
}
#define kill simulated_kill
#define PrivClass(x) MockSceneManager

@interface MockWindowScene : NSObject
@property BOOL unregistered;
- (void)_unregisterSettingsDiffActionArrayForKey:(NSString *)key;
@end
@implementation MockWindowScene
- (void)_unregisterSettingsDiffActionArrayForKey:(NSString *)key {
    self.unregistered = key != nil;
}
@end

@interface MockWindow : NSObject
@property(nonatomic, strong) MockWindowScene *windowScene;
@end
@implementation MockWindow @end
@interface MockView : NSObject
@property(nonatomic, strong) MockWindow *window;
@end
@implementation MockView @end

@interface MockPresenter : NSObject
@property BOOL deactivated;
@property BOOL invalidated;
- (void)deactivate;
- (void)invalidate;
@end
@implementation MockPresenter
- (void)deactivate { self.deactivated = YES; }
- (void)invalidate { self.invalidated = YES; }
@end

@interface MockSceneManager : NSObject
@property NSUInteger destroyCalls;
+ (instancetype)sharedInstance;
- (void)destroyScene:(id)scene withTransitionContext:(id)context;
@end
@implementation MockSceneManager
+ (instancetype)sharedInstance {
    static MockSceneManager *manager;
    static dispatch_once_t once;
    dispatch_once(&once, ^{ manager = [MockSceneManager new]; });
    return manager;
}
- (void)destroyScene:(id)scene withTransitionContext:(id)context {
    (void)scene; (void)context; self.destroyCalls++;
}
@end

@interface MockDelegate : NSObject
@property BOOL notified;
- (void)appDidExit;
@end
@implementation MockDelegate
- (void)appDidExit { self.notified = YES; }
@end

@interface ResearchController : NSObject
@property(nonatomic, strong) MockView *view;
@property(nonatomic, strong) MockPresenter *presenter;
@property(nonatomic, strong) MockDelegate *delegate;
@property int pid;
@property(nonatomic, readonly) BOOL isAppRunning;
- (void)closeWindow;
@end
@implementation ResearchController
- (BOOL)isAppRunning { return YES; }
__ACTUAL_METHOD__
@end

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 2) return 2;
        BOOL expectSignal = atoi(argv[1]) != 0;
        ResearchController *controller = [ResearchController new];
        controller.pid = 42;
        MockWindowScene *scene = [MockWindowScene new];
        MockWindow *window = [MockWindow new]; window.windowScene = scene;
        MockView *view = [MockView new]; view.window = window; controller.view = view;
        MockPresenter *presenter = [MockPresenter new]; controller.presenter = presenter;
        MockDelegate *delegate = [MockDelegate new]; controller.delegate = delegate;
        [controller closeWindow];
        if ((signalCount != 0) != expectSignal) return 10;
        if (!scene.unregistered || [MockSceneManager sharedInstance].destroyCalls != 1) return 11;
        if (!presenter.deactivated || !presenter.invalidated || controller.presenter != nil) return 12;
        if (!delegate.notified || controller.delegate != nil) return 13;
        printf("PASS intercepted signals=%d; presenter and delegate cleanup called\n", signalCount);
    }
    return 0;
}
'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--expect-signal", action="store_true")
    args = parser.parse_args()
    method = extract_method(args.source.read_text())
    with tempfile.TemporaryDirectory(prefix="pocketdesktop-lifecycle-") as directory:
        fixture = Path(directory) / "fixture.m"
        executable = Path(directory) / "fixture"
        fixture.write_text(FIXTURE.replace("__ACTUAL_METHOD__", method))
        subprocess.run(["clang", "-fobjc-arc", "-framework", "Foundation", str(fixture),
                        "-o", str(executable)], check=True)
        subprocess.run([str(executable), "1" if args.expect_signal else "0"], check=True)


if __name__ == "__main__":
    main()
