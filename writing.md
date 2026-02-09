---
layout: page
title: Writing
permalink: /writing/
---

## Writing

Essays, reflections, and thoughts on various topics.

### Medium

Read more on [Medium (@sh299999zhang)](https://medium.com/@sh299999zhang).

1. **[From Age-Structured Models to Artificial Life](https://medium.com/@sh299999zhang/from-age-structured-models-to-artificial-life-62ec6630b00c)** — How natural selection acts on neural networks · Feb 2026

2. **[Graph Theory Kindergarten](https://medium.com/@sh299999zhang/graph-theory-kindergarten-37f56253d174)** — A daydream about education · Oct 2025

3. **[The Dumpling Dream of Oxford](https://medium.com/@sh299999zhang/the-dumpling-dream-of-oxford-5c7c6a9a41c7)** — Every food can be approximated by dumplings · Jun 2025

---

### Blog Posts

{% assign writing_posts = site.posts | where_exp: "post", "post.categories contains 'writing'" %}
{% if writing_posts.size > 0 %}
<ul>
{% for post in writing_posts limit:10 %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
    <span style="color: #828282;"> — {{ post.date | date: "%b %d, %Y" }}</span>
  </li>
{% endfor %}
</ul>
{% else %}
*No posts yet.*
{% endif %}
