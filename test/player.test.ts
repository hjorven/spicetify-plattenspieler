import { describe, expect, it } from "vitest";
import { EMPTY_TRACK, normalizeImageUrl, readPlayer } from "../src/lib/player";

describe("normalizeImageUrl", () => {
  it("converts spotify:image URIs", () => {
    expect(normalizeImageUrl("spotify:image:ab67")).toBe("https://i.scdn.co/image/ab67");
  });
  it("keeps https URLs and handles empty input", () => {
    expect(normalizeImageUrl("https://x/y.jpg")).toBe("https://x/y.jpg");
    expect(normalizeImageUrl(undefined)).toBe("");
    expect(normalizeImageUrl("spotify:image:")).toBe("");
  });
});

describe("readPlayer", () => {
  const item = {
    name: "Song",
    uri: "spotify:track:1",
    artists: [{ name: "A" }, { name: "B" }],
    album: { name: "Alb", images: [{ url: "spotify:image:img" }] },
  };

  it("returns the empty state without a track", () => {
    expect(readPlayer(undefined)).toBe(EMPTY_TRACK);
    expect(readPlayer({ data: {} })).toBe(EMPTY_TRACK);
  });

  it("prefers the getters", () => {
    const t = readPlayer({
      data: { item, duration: 1, position: 1, isPaused: true },
      getDuration: () => 200_000,
      getProgress: () => 50_000,
      isPlaying: () => true,
    });
    expect(t).toMatchObject({
      hasTrack: true,
      key: "spotify:track:1",
      title: "Song",
      artist: "A, B",
      album: "Alb",
      albumArt: "https://i.scdn.co/image/img",
      isPlaying: true,
      durationMs: 200_000,
      progress: 0.25,
    });
  });

  it("falls back to Player.data and metadata", () => {
    const t = readPlayer({
      data: {
        item: { name: "S", metadata: { image_xlarge_url: "spotify:image:big", artist_name: "M" } },
        duration: 100_000,
        position: 25_000,
        isPaused: true,
      },
    });
    expect(t).toMatchObject({ artist: "M", albumArt: "https://i.scdn.co/image/big", isPlaying: false, progress: 0.25 });
  });

  it("survives throwing getters", () => {
    const t = readPlayer({
      data: { item, duration: 100_000, position: 10_000 },
      getDuration: () => {
        throw new Error("x");
      },
      isPlaying: () => {
        throw new Error("x");
      },
    });
    expect(t.durationMs).toBe(100_000);
    expect(t.isPlaying).toBe(true);
  });
});
