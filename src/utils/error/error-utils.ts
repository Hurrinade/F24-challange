const fallbackErrorMessage = "Something went wrong.";

function getConvexErrorData(error: unknown) {
  if (typeof error !== "object" || error == null || !("data" in error)) {
    return null;
  }

  const { data } = error;

  return typeof data === "string" && data.trim() ? data : null;
}

export function getErrorMessage(error: unknown) {
  const convexErrorData = getConvexErrorData(error);

  if (convexErrorData) {
    return convexErrorData;
  }

  return fallbackErrorMessage;
}
