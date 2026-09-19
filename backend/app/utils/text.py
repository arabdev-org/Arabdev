import re

# Common spellings mapped to the canonical tag slug, so "#js" and "#JavaScript" land together.
TAG_ALIASES = {
    "c++": "cpp",
    "c#": "csharp",
    ".net": "dotnet",
    "node.js": "nodejs",
    "node": "nodejs",
    "js": "javascript",
    "ts": "typescript",
    "golang": "go",
    "ml": "machine-learning",
    "security": "cybersecurity",
    "infosec": "cybersecurity",
    "sql": "databases",
    "database": "databases",
    "gamedev": "game-development",
    "mobile": "mobile-development",
    "ui": "ui-ux",
    "ux": "ui-ux",
    "uiux": "ui-ux",
    "ui/ux": "ui-ux",
    "opensource": "open-source",
    "oss": "open-source",
    "vue.js": "vue",
    "vuejs": "vue",
    "reactjs": "react",
    "react.js": "react",
}

_TAG_STRIP_RE = re.compile(r"[^a-z0-9؀-ۿ-]+")
_DASHES_RE = re.compile(r"-{2,}")

MENTION_RE = re.compile(r"(?<![\w@])@([a-zA-Z][a-zA-Z0-9_]{2,19})\b")


def slugify_tag(name: str) -> str:
    value = name.strip().lstrip("#").strip().lower()
    if value in TAG_ALIASES:
        return TAG_ALIASES[value]
    value = value.replace("+", "p").replace("#", "sharp")
    value = re.sub(r"[\s_./]+", "-", value)
    value = _TAG_STRIP_RE.sub("", value)
    value = _DASHES_RE.sub("-", value).strip("-")
    return TAG_ALIASES.get(value, value)[:40]


def extract_mentions(text: str, limit: int = 10) -> list[str]:
    seen: list[str] = []
    for match in MENTION_RE.finditer(text or ""):
        username = match.group(1).lower()
        if username not in seen:
            seen.append(username)
        if len(seen) >= limit:
            break
    return seen


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
