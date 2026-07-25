const USER_NAME_STORAGE_KEY = "tasksync:userName";

export function getSavedUserName(): string {
  try {
    return localStorage.getItem(USER_NAME_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveUserName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(USER_NAME_STORAGE_KEY, trimmed);
  } catch {
    // localStorage unavailable (private mode etc.)
  }
}
