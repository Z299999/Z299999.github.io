---
layout: page
title: Films
permalink: /films/
---

## Film Projects

I create documentary and creative films exploring themes of nature, identity, and human experience.

### Current Projects

{% for film in site.data.films %}
<div class="film-item" style="margin-bottom: 1.5rem;">
  <h4><a href="{{ film.link }}">{{ film.title }}</a></h4>
  <p><em>{{ film.logline }}</em></p>
  <p><strong>Status:</strong> {{ film.status }}</p>
</div>
{% endfor %}

### Archive

*More projects coming soon.*
