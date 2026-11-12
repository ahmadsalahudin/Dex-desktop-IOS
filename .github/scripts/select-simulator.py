#!/usr/bin/env python3
"""Find or create a specific iPhone generation on the newest installed iOS runtime."""
import json
import re
import subprocess
import sys


def simctl(*args):
    return subprocess.check_output(["xcrun", "simctl", *args], text=True).strip()


def pick_phone(items, generation):
    pattern = re.compile(r"^iPhone " + re.escape(generation) + r"(?:e| |$)")
    choices = [item for item in items if pattern.search(item.get("name", ""))]
    choices.sort(key=lambda item: ("Pro" not in item["name"], "Max" in item["name"], item["name"]))
    return choices[0] if choices else None


def version_key(runtime):
    return tuple(int(n) for n in re.findall(r"\d+", runtime.get("version", "0")))


def main(generation):
    runtimes = json.loads(simctl("list", "runtimes", "--json"))["runtimes"]
    runtimes = [r for r in runtimes if r.get("isAvailable") and r.get("identifier", "").startswith("com.apple.CoreSimulator.SimRuntime.iOS-")]
    if not runtimes:
        raise RuntimeError("No iOS Simulator runtime is installed on the runner")
    runtimes.sort(key=version_key, reverse=True)
    devices_by_runtime = json.loads(simctl("list", "devices", "available", "--json"))["devices"]
    device = None
    runtime = None
    for candidate in runtimes:
        device = pick_phone(devices_by_runtime.get(candidate["identifier"], []), generation)
        if device:
            runtime = candidate
            break
    if device and runtime:
        identifier = device["udid"]
    else:
        types = json.loads(simctl("list", "devicetypes", "--json"))["devicetypes"]
        model = pick_phone(types, generation)
        if not model:
            raise RuntimeError(f"No iPhone {generation} simulator device type is installed")
        for candidate in runtimes:
            try:
                identifier = simctl("create", f"PocketDesktop-iPhone-{generation}", model["identifier"], candidate["identifier"])
                runtime = candidate
                device = {"name": model["name"]}
                break
            except subprocess.CalledProcessError:
                continue
        if runtime is None:
            raise RuntimeError(f"No installed iOS runtime supports the iPhone {generation} simulator")
    print(f"Selected {device['name']} on {runtime['name']}", file=sys.stderr)
    print(identifier)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Usage: select-simulator.py <iPhone generation>")
    try:
        main(sys.argv[1])
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        sys.exit(str(exc))
