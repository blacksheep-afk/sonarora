"""Evidence validation only; no application imports or browser acceptance policy."""
import argparse
import hashlib
import importlib.metadata
import json
import platform
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXPECTED_FIXTURE = "cffd8991304e3f5a2028b4e4de0869c38772ebe399444ae992148dbf67832f73"
EXPECTED_PROBE = "9b089012e73d18f64c01892993af1ef97a4e5ce54a0977c38018e665cc2ecfa1"
EXPECTED_PLAYWRIGHT = "1.64.1"


def verify_sources(directory=HERE):
    for name, expected in [("native.html", EXPECTED_FIXTURE),
                           ("linux-native-probe.py", EXPECTED_PROBE)]:
        actual = hashlib.sha256((directory / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Exact diagnostic source mismatch: {name}: {actual}")
    return {"fixtureSha256": EXPECTED_FIXTURE, "probeSha256": EXPECTED_PROBE}


def preflight(output):
    sources = verify_sources()
    version = importlib.metadata.version("playwright")
    if version != EXPECTED_PLAYWRIGHT:
        raise ValueError(f"Expected Playwright {EXPECTED_PLAYWRIGHT}, found {version}")
    distribution = importlib.metadata.distribution("playwright")
    driver_file = Path(distribution.locate_file("playwright/driver/package/package.json"))
    driver_version = json.loads(driver_file.read_text(encoding="utf-8"))["version"]
    metadata = {**sources, "environment": platform.platform(),
                "python": sys.version, "playwright": version,
                "bundledDriverVersion": driver_version,
                "osRelease": platform.freedesktop_os_release() if sys.platform == "linux" else None}
    output.mkdir(parents=True, exist_ok=True)
    (output / "environment.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metadata, indent=2))


def interpret(output):
    data = json.loads((output / "focus.json").read_text(encoding="utf-8"))
    if data.get("status") != "executed":
        raise ValueError("Native probe did not execute successfully")
    if data.get("playwright") != EXPECTED_PLAYWRIGHT or data.get("headless") is not True:
        raise ValueError("Unexpected Playwright version or launch mode")
    if not isinstance(data.get("browserVersion"), str) or not data["browserVersion"]:
        raise ValueError("Actual WebKit version is missing")
    sequence = data.get("sequence")
    if not isinstance(sequence, list) or len(sequence) != 8:
        raise ValueError("Exactly eight plain-Tab observations are required")
    for item in sequence:
        if (not isinstance(item, dict) or item.get("tag") not in {"A", "BUTTON", "INPUT", "BODY"}
                or not isinstance(item.get("hasFocus"), bool)):
            raise ValueError("Malformed focus observation")
    interpretation = {
        "status": "diagnostic-executed", "browserVersion": data["browserVersion"],
        "tags": [item["tag"] for item in sequence],
        "firstTabReachedNativeLink": sequence[0]["tag"] == "A",
        "nativeLinkReachedWithinEightTabs": any(item["tag"] == "A" for item in sequence),
        "applicationAcceptance": "not tested; this is a native HTML diagnostic only",
        "meaning": "Successful evidence collection does not imply keyboard accessibility passed."
    }
    (output / "interpretation.json").write_text(json.dumps(interpretation, indent=2), encoding="utf-8")
    print(json.dumps(interpretation, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["sources", "preflight", "interpret"])
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.mode == "sources":
        print(json.dumps(verify_sources(), indent=2))
    elif args.mode == "preflight":
        preflight(args.output)
    else:
        interpret(args.output)


if __name__ == "__main__":
    main()
