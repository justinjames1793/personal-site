import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON } from '../global.js';

// The skill pills: one row per group (Languages, Data and ML, ...), and one
// pill button per skill. Clicking a pill fades out the sections of the page
// that didn't use that skill. Which skill was used where lives in lib/skills.json.
const skills = await fetchJSON('../lib/skills.json');

// Every section that a skill can point to has a data-short attribute
const entries = [...document.querySelectorAll('[data-short]')];
const entryIds = entries.map((entry) => entry.id);

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
  .text((skill) => skill.name)
  .on('click', (event, skill) => {
    // Clicking the selected skill again clears it
    selectedSkill = selectedSkill === skill.name ? null : skill.name;
    updatePage();
  });

// The single place the filter applies: the pills, the jump links and the sections
function updatePage() {
  const skill = skills.find((candidate) => candidate.name === selectedSkill);

  // .classed adds or removes one class without touching the others
  pills.classed('selected', (pill) => pill.name === selectedSkill);
  pills.attr('aria-pressed', (pill) => pill.name === selectedSkill);

  for (let entry of entries) {
    entry.classList.toggle('dim', Boolean(skill) && !skill.in.includes(entry.id));
  }
  for (let link of document.querySelectorAll('.jump-links a')) {
    const id = link.getAttribute('href').slice(1);
    const isEntry = entryIds.includes(id);
    link.classList.toggle('dim', Boolean(skill) && isEntry && !skill.in.includes(id));
  }

  const count = skill ? skill.in.length : 0;
  document.querySelector('#skills-status').textContent = skill
    ? `${skill.name}: used in ${count} ${count === 1 ? 'part' : 'parts'} of this page, highlighted below.`
    : 'Click a skill to highlight where I used it.';
  document.querySelector('#skills-clear').hidden = !skill;
}

document.querySelector('#skills-clear').addEventListener('click', () => {
  selectedSkill = null;
  updatePage();
});

updatePage();
