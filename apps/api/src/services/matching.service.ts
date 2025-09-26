export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\b(the|le|la|les|feat|ft|remix|official|audio|video)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchTitleArtist(
  userText: string,
  officialTitle?: string | null,
  officialArtist?: string | null,
  aliases: string[] = [],
) {
  const nUser = normalize(userText);
  const titleOk = officialTitle
    ? nUser.includes(normalize(officialTitle))
    : false;
  const artistOk = [officialArtist, ...aliases]
    .filter(Boolean)
    .some((a) => nUser.includes(normalize(a!)));
  return { matchTitle: titleOk, matchArtist: artistOk };
}
