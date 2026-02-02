---
layout: page
title: Publications
permalink: /research/publications/
---

## Publications

Academic papers and conference proceedings.

{% for pub in site.data.publications %}
<div class="publication" style="margin-bottom: 1.5rem;">
  <h4>{{ pub.title }}</h4>
  <p>{{ pub.authors }}</p>
  <p><em>{{ pub.venue }}</em>, {{ pub.year }}</p>
  {% if pub.link %}
  <p><a href="{{ pub.link }}">[PDF]</a></p>
  {% endif %}
</div>
{% endfor %}

---

[← Back to Research](/research/)
