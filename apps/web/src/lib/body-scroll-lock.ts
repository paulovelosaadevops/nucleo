let activeLocks = 0;
let originalOverflow = "";

export function acquireBodyScrollLock():
  () => void {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  if (activeLocks === 0) {
    originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    document.body.dataset.modalOpen =
      "true";
  }

  activeLocks += 1;

  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;

    activeLocks = Math.max(
      0,
      activeLocks - 1,
    );

    if (activeLocks > 0) {
      return;
    }

    delete document.body.dataset
      .modalOpen;

    if (originalOverflow) {
      document.body.style.overflow =
        originalOverflow;
    } else {
      document.body.style.removeProperty(
        "overflow",
      );
    }

    originalOverflow = "";
  };
}

export function resetBodyScrollLocks() {
  if (typeof document === "undefined") {
    return;
  }

  activeLocks = 0;
  originalOverflow = "";

  delete document.body.dataset.modalOpen;

  document.body.style.removeProperty(
    "overflow",
  );
}