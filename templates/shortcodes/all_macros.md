{% set data = load_data(path="static/toml/test.toml") %}

{% for section_name, section_data in data %}
{{ macro(section_name=section_name) }}
{% endfor %}

Test
