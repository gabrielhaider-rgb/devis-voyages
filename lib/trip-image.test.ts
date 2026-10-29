import { describe, expect, it } from "vitest";
import { unsplashPhotoId } from "./trip-image";

describe("unsplashPhotoId", () => {
  it("extrait l'identifiant d'une page Unsplash, en français ou non", () => {
    expect(unsplashPhotoId("https://unsplash.com/fr/photos/un-couple-de-chariots-jaunes-roulant-dans-une-rue-oiVvB-A7XDM")).toBe("oiVvB-A7XDM");
    expect(unsplashPhotoId("https://unsplash.com/photos/waterfalls-at-daytime-zNN6ubHmruI")).toBe("zNN6ubHmruI");
    expect(unsplashPhotoId("https://unsplash.com/photos/zNN6ubHmruI")).toBe("zNN6ubHmruI");
    expect(unsplashPhotoId("https://unsplash.com/fr/photos/scooters-sur-la-rue-pavee-a-rome-LLRENtzIo34?utm_source=x")).toBe("LLRENtzIo34");
  });

  it("ignore les autres adresses", () => {
    expect(unsplashPhotoId("https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1600")).toBeNull();
    expect(unsplashPhotoId("https://exemple.fr/photos/lisbonne.jpg")).toBeNull();
    expect(unsplashPhotoId("https://unsplash.com/fr/s/photos/lisbon")).toBeNull();
  });
});
