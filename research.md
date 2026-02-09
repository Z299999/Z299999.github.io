---
layout: page
title: Research
permalink: /research/
---

## Research Overview

My research focuses on *[your research area]*. Below you'll find my ongoing work, notes, and publications.

### Areas of Interest

1. **Topic One** — Partial Differential Equations
2. **Topic Two** — Mathematical Biology
3. **Topic Three** — Control and System Theory
4. **Topic Four** — Deep Learning
5. **Topic Five** — Network Theory


---

## Projects

### Eco-evolutionary Neural Ecosystem

A computational framework for studying the emergence of complex behaviors through the co-evolution of neural agents and their environment.

- [Project Overview](/research/eco-evo/) — Motivation, mechanisms, and status
- [Interactive Demo](/research/eco-evo/demo.html) — Visualization interface (placeholder)

---

### Resources

- [Research Notes](/research/notes/) — Working notes and thoughts
- [Publications](/research/publications/) — Papers and conference proceedings

### Recent Research Posts

{% assign research_posts = site.posts | where_exp: "post", "post.categories contains 'research'" %}
{% if research_posts.size > 0 %}
<ul>
{% for post in research_posts limit:5 %}
  <li><a href="{{ post.url }}">{{ post.title }}</a> — {{ post.date | date: "%b %d, %Y" }}</li>
{% endfor %}
</ul>
{% else %}
*No research posts yet.*
{% endif %}
