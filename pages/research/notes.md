---
layout: page
title: Research Notes
permalink: /research/notes/
---

## Research Notes

Working notes, reading summaries, and ongoing thoughts.

### Topics

- **Topic A** — *Notes coming soon*
- **Topic B** — *Notes coming soon*
- **Topic C** — *Notes coming soon*

### Recent Notes

{% assign research_posts = site.posts | where_exp: "post", "post.categories contains 'research'" %}
{% if research_posts.size > 0 %}
<ul>
{% for post in research_posts %}
  <li><a href="{{ post.url }}">{{ post.title }}</a> — {{ post.date | date: "%b %d, %Y" }}</li>
{% endfor %}
</ul>
{% else %}
*No notes posted yet.*
{% endif %}

---

[← Back to Research](/research/)
