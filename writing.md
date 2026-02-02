---
layout: page
title: Writing
permalink: /writing/
---

## Writing

Essays, reflections, and thoughts on various topics.

### Recent Posts

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

### External Writing

- [Medium](/writing/medium/) — Essays and articles on Medium
- [Essays](/writing/essays/) — *Coming soon*
