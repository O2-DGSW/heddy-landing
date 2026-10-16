/** visibility를 명시한 SVG 자식도 장면 밖에서는 그리지 못하도록 display까지 끈다. */
export const applySceneVisibility = (root: HTMLElement, isActive: boolean): void => {
  root.style.display = isActive ? "" : "none";
  root.style.visibility = isActive ? "visible" : "hidden";
};
