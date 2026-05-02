



```txt
views:
  - type: table
    name: Table
    filters:
      and:
        - file.inFolder("organizations")
    order:
      - file.name
      - date_created
      - for_clients
      - file.size

```