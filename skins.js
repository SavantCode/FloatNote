// ---------------------------------------------------------------
// SKINS: each skin = one artwork PNG + where the text lives on it.
// To add a new design: drop the PNG in /images and add an entry.
//
//   baseWidth  : note width in px at 100% size
//   box        : text area as % of the image (top/left/right/bottom)
//   fontSize   : px at baseWidth
//   lineHeight : px at baseWidth  -> match the ruled lines of your art
//   ink        : handwriting colour
//   tilt       : degrees, tiny rotation so it feels hand-written
// ---------------------------------------------------------------
const SKINS = [
  {
    id: "default",
    name: "My note",
    file: "images/image.png",
    baseWidth: 320,
    box: { top: 22, left: 11, right: 10, bottom: 10 },
    fontSize: 25,
    lineHeight: 34,
    ink: "#27305a",
    tilt: -0.5
  },
  {
    id: "camera",
    name: "Quote Camera",
    file: "images/camera.png",
    baseWidth: 320,
    box: { top: 30, left: 25, right: 20, bottom: 25 },
    fontSize: 22,
    lineHeight: 30,
    ink: "#3b2a20",
    tilt: 0
  },
  {
    id: "Ribbon Note",
    name: "Ribbon Notte",
    file: "images/red_ribbon.png",
    baseWidth: 320,
    box: { top: 22, left: 23, right: 15, bottom: 20 },
    fontSize: 22,
    lineHeight: 30,
    ink: "#3b2a20",
    tilt: 0
  },
  {
    id: "Music Note",
    name: "Music Notte",
    file: "images/music_design.png",
    baseWidth: 320,
    box: { top: 25, left: 25, right: 17, bottom: 25 },
    fontSize: 22,
    lineHeight: 30,
    ink: "#3b2a20",
    tilt: 0
  }
  // To add more, just drop another image in /images and copy this block:
  // , {
  //   id: "cloud",
  //   name: "Cloud Note",
  //   file: "images/cloud.png",
  //   baseWidth: 320,
  //   box: { top: 25, left: 15, right: 15, bottom: 22 },
  //   fontSize: 20,
  //   lineHeight: 28,
  //   ink: "#1f3a40",
  //   tilt: 0.5
  // }
];