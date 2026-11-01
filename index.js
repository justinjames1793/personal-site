// Landmarks: scrolling picture frames ---

const track = document.querySelector('.marquee-track');
const motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;

// The CSS slides the track left by exactly half its width, then starts over.
// With the frames repeated once, the two halves match, so the jump can't be seen.
if (motionOK) {
  for (let frame of [...track.children]) {
    let copy = frame.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');  // screen readers skip the repeats
    copy.tabIndex = -1;                        // and so does the Tab key
    track.append(copy);
  }
}

// Arrows: fast forward or rewind through the frames ---

const marquee = document.querySelector('.marquee');
let slowDownTimer;

function fastForward(direction) {
  let slide = track.getAnimations()[0];

  // Reduced motion: nothing is sliding, so just scroll the row instead
  if (!slide) {
    marquee.scrollBy({ left: direction * 600, behavior: 'smooth' });
    return;
  }

  // Rewinding from the very start would stop the animation, so go one loop ahead first
  let oneLoop = slide.effect.getTiming().duration;
  if (direction < 0 && slide.currentTime < oneLoop) {
    slide.currentTime += oneLoop;
  }

  // Run the slide 40 times faster for half a second, then back to normal.
  // A negative speed plays it backward. Clicking again extends the fast part.
  slide.playbackRate = direction * 40;
  clearTimeout(slowDownTimer);
  slowDownTimer = setTimeout(function () {
    slide.playbackRate = 1;
  }, 500);
}

document.querySelector('.marquee-arrow.next').addEventListener('click', function () {
  fastForward(1);
});
document.querySelector('.marquee-arrow.prev').addEventListener('click', function () {
  fastForward(-1);
});

// Bigger view ---

const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxCaption = lightbox.querySelector('p');

// One listener on the whole page handles every clickable photo: the frames
// (including the repeats) and the Mont Blanc, sports and community photos
document.addEventListener('click', function (event) {
  let photo = event.target.closest('.frame, .zoom');
  if (!photo) return;

  let img = photo.querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  // Not every photo has a caption, so fall back to its description
  lightboxCaption.textContent = photo.querySelector('span')?.textContent ?? img.alt;

  // showModal() also makes the Esc key close it
  lightbox.showModal();
});

lightbox.querySelector('.lightbox-close').addEventListener('click', function () {
  lightbox.close();
});

// Clicking the dark area around the photo closes it too.
// That click lands on the <dialog> itself, not on anything inside it.
lightbox.addEventListener('click', function (event) {
  if (event.target === lightbox) {
    lightbox.close();
  }
});
