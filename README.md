# Reproduction case
When creating address with the same id, we expect a constraint violation error.
This is not the case when the address is already loaded in the entity manager cache.