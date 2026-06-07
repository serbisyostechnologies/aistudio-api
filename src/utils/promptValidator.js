export const cleanPrompt = (prompt, options = {}) => {
  if (!prompt || typeof prompt !== "string") {
    return "";
  }

  const {
    maxLength = 500,
    removeSensitiveInfo = true,
    removeUnsafeContent = true,
  } = options;

  let clean = prompt.trim();

  clean = clean.replace(/\s+/g, " ");
  clean = clean.slice(0, maxLength);

  if (removeSensitiveInfo) {
    clean = clean.replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      "[EMAIL]",
    );
    clean = clean.replace(/\b\d{10,15}\b/g, "[PHONE]");
    clean = clean.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[AADHAAR]");
    clean = clean.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g, "[PAN]");
    clean = clean.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[CARD]");
    clean = clean.replace(/api[_-]?key\s*[:=]?\s*[a-z0-9\-_]+/gi, "[API_KEY]");
    clean = clean.replace(/bearer\s+[a-z0-9\-_.]+/gi, "[TOKEN]");
    clean = clean.replace(/password\s*[:=]?\s*\S+/gi, "[PASSWORD]");
  }

  if (removeUnsafeContent) {
    const blockedPatterns = [
      /ignore previous instructions/gi,
      /system prompt/gi,
      /developer message/gi,
      /jailbreak/gi,
      /bypass restrictions/gi,
      /pretend to be/gi,
      /act as/gi,
    ];

    blockedPatterns.forEach((pattern) => {
      clean = clean.replace(pattern, "[BLOCKED]");
    });
  }

  return clean.trim();
};