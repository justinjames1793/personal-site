import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from '../global.js';

// The skill filter. Each skill is a pill button, grouped in rows (Languages,
// Data and ML, ...). Clicking a pill shows ONLY the parts of the page where I
// used that skill, hides everything else, and scrolls down to the first match.
// Clicking it again, or "Show everything", brings the whole page back.
// Which skill was used where lives in lib/skills.json ("in" = section ids).
const skills = await fetchJSON('../lib/skills.json');

// Every part a skill can point to has a data-short attribute:
// the Experience sections and the three project cards
const entries = [...document.querySelectorAll('[data-short]')];

// The big part headings ("Experience", "Projects"), each with the entries under it.
// An entry belongs to the last heading that comes before it on the page.
const partHeads = [...document.querySelectorAll('.part-head')];
const entriesOfPart = new Map(partHeads.map((head) => [head, []]));
for (let entry of entries) {
  let owner = partHeads.filter((head) =>
    head.compareDocumentPosition(entry) & Node.DOCUMENT_POSITION_FOLLOWING).at(-1);
  entriesOfPart.get(owner)?.push(entry);
}

// Things that don't belong to any skill, hidden while a skill is picked
const education = document.querySelector('#education');
const projectsSection = document.querySelector('#projects');   // holds the project cards

// The sticky row of section links: a "Python ×" chip there clears the filter
// even when you've scrolled far down the page
const jumpBar = document.querySelector('.jump-links');
const jumpChip = document.createElement('button');
jumpChip.type = 'button';
jumpChip.className = 'jump-filter';
jumpChip.hidden = true;
jumpBar.prepend(jumpChip);

// d3.groups turns the flat list into [[groupName, [skills...]], ...]
const groups = d3.groups(skills, (skill) => skill.group);

// Filter state: the name of the clicked skill, or null for none
let selectedSkill = null;

// One row per group: a small label, then the pills
const groupRows = d3.select('#skill-groups')
  .selectAll('div')
  .data(groups)
  .join('div')
  .attr('class', 'skill-group');

groupRows.append('h3').text(([group]) => group);

const pills = groupRows.append('ul')
  .selectAll('li')
  .data(([, groupSkills]) => groupSkills)
  .join('li')
  .append('button')
  .attr('type', 'button')
  .attr('class', 'skill-pill')
  .on('click', (event, skill) => {
    // Clicking the selected skill again clears it
    let picking = selectedSkill !== skill.name;
    selectedSkill = picking ? skill.name : null;
    updatePage();
    if (picking) scrollToResults();
  });

// Pill text: the skill name, then how many places it shows up in
pills.append('span').text((skill) => skill.name);
pills.append('span').attr('class', 'count').text((skill) => skill.in.length);

// Hide or show one element. A class (not the hidden attribute) because
// sections use display: grid, which would beat the hidden attribute.
function setShown(element, shown) {
  element?.classList.toggle('filtered-out', !shown);
}

// The single place the filter applies: pills, sections, headings and jump links
function updatePage() {
  const skill = skills.find((candidate) => candidate.name === selectedSkill);
  const uses = (id) => !skill || skill.in.includes(id);

  // .classed adds or removes one class without touching the others
  pills.classed('selected', (pill) => pill.name === selectedSkill);
  pills.attr('aria-pressed', (pill) => pill.name === selectedSkill);

  // Sections and cards
  for (let entry of entries) setShown(entry, uses(entry.id));
  setShown(education, !skill);

  // A part heading only shows if something under it is still showing
  for (let [head, partEntries] of entriesOfPart) {
    setShown(head, partEntries.some((entry) => uses(entry.id)));
  }
  // The project cards' box hides when none of its cards match
  let anyCard = entries.some((entry) => projectsSection?.contains(entry) && uses(entry.id));
  setShown(projectsSection, anyCard);

  // Jump links follow the same rules as the parts they point to
  for (let link of jumpBar.querySelectorAll('a')) {
    let target = document.querySelector(link.getAttribute('href'));
    let shown = !target?.classList.contains('filtered-out');
    if (target === document.querySelector('#skills')) shown = true;
    setShown(link, shown);
  }
  // A separator line only shows if the part label right after it shows
  for (let sep of jumpBar.querySelectorAll('.jump-sep')) {
    setShown(sep, !sep.nextElementSibling?.classList.contains('filtered-out'));
  }

  // The chip in the jump bar and the message under the heading
  jumpChip.hidden = !skill;
  jumpChip.textContent = skill ? `${skill.name} ×` : '';
  jumpChip.setAttribute('aria-label', skill ? `Stop filtering by ${skill.name}` : '');

  const count = skill ? skill.in.length : 0;
  document.querySelector('#skills-status').textContent = skill
    ? `Showing the ${count} ${count === 1 ? 'place' : 'places'} I used ${skill.name}.`
    : 'Pick a skill to see only the work where I used it.';
  document.querySelector('#skills-clear').hidden = !skill;
}

// Scroll to the first heading still showing below the skills
function scrollToResults() {
  let first = partHeads.find((head) => !head.classList.contains('filtered-out'));
  let smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  first?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
}

// "Show everything" next to the message: clear, stay put
document.querySelector('#skills-clear').addEventListener('click', () => {
  selectedSkill = null;
  updatePage();
});

// The chip in the jump bar: clear and go back up to the pills
jumpChip.addEventListener('click', () => {
  selectedSkill = null;
  updatePage();
  document.querySelector('#skills').scrollIntoView({ block: 'start' });
});

updatePage();
