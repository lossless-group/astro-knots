<script lang="ts">
  export let label: string;
</script>

<button class="knots-btn">{label}</button>

<style>
  .knots-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.375rem;
    background: var(--color-primary, #2563eb);
    color: white;
  }
</style>