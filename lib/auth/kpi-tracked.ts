export function isKpiTracked(profile: { kpi_tracked?: boolean | null }): boolean {
  return profile.kpi_tracked !== false;
}
