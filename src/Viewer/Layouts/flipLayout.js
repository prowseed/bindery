import h from 'hyperscript';
import { c } from '../../utils';

const renderFlipLayout = (pages, doubleSided) => {
  const flipLayout = document.createDocumentFragment();
  const sizer = h(c('.spread-size') + c('.flip-sizer'));
  const flapHolder = h(c('.spread-size') + c('.flap-holder'));
  sizer.appendChild(flapHolder);
  flipLayout.appendChild(sizer);
  const flaps = [];
  let currentLeaf = -1;

  let leftOffset = 4;
  if (pages.length * leftOffset > 60) {
    leftOffset = 60 / pages.length;
  }
  flapHolder.style.width = `${pages.length * leftOffset}px`;

  const setLeaf = (n) => {
    let newLeaf = n;
    if (newLeaf === currentLeaf) newLeaf += 1;
    currentLeaf = newLeaf;

    let zScale = 4;
    if (flaps.length * zScale > 200) zScale = 200 / flaps.length;

    flaps.forEach((flap, i, arr) => {
      // + 0.5 so left and right are even
      const z = (arr.length - Math.abs((i - newLeaf) + 0.5)) * zScale;
      flap.style.transform = `translate3d(${(i < newLeaf) ? 4 : 0}px,0,${z}px) rotateY(${(i < newLeaf) ? -180 : 0}deg)`;
    });
  };

  let leafIndex = 0;
  for (let i = 1; i < pages.length - 1; i += (doubleSided ? 2 : 1)) {
    leafIndex += 1;
    const li = leafIndex;
    const flap = h(c('.page3d') + c('.page-size'), {
      onclick: () => {
        const newLeaf = li - 1;
        setLeaf(newLeaf);
      },
    });

    const rightPage = pages[i].element;
    let leftPage;
    rightPage.classList.add(c('page3d-front'));
    flap.appendChild(rightPage);
    if (doubleSided) {
      flap.classList.add(c('doubleSided'));
      leftPage = pages[i + 1].element;
      leftPage.classList.add(c('page3d-back'));
      flap.appendChild(leftPage);
    } else {
      leftPage = h(c('.page') + c('.page3d-back'));
      flap.appendChild(leftPage);
    }
    // TODO: Dynamically add/remove pages.
    // Putting 1000s of elements onscreen
    // locks up the browser.

    flap.style.left = `${i * leftOffset}px`;

    flaps.push(flap);
    flapHolder.appendChild(flap);
  }

  setLeaf(0);
  return flipLayout;
};

export default renderFlipLayout;
