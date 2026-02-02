---
layout: page
title: Life
permalink: /life/
---

## Life

Adventures, van life, travel, and personal stories.

### Recent Posts

{% assign life_posts = site.posts | where_exp: "post", "post.categories contains 'life'" %}
{% if life_posts.size > 0 %}
<ul>
{% for post in life_posts limit:10 %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
    <span style="color: #828282;"> — {{ post.date | date: "%b %d, %Y" }}</span>
  </li>
{% endfor %}
</ul>
{% else %}
*No posts yet.*
{% endif %}

### Featured

- [Van Life](/life/vanlife/) — Living on the road
