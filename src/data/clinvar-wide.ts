/**
 * Reclassification across the whole of ClinVar, for scale beside the
 * workspace's own figures.
 *
 * Huda's release comparison (the pipeline behind
 * `clinvar_reclassification_candidates_2023-01_to_2026-09.csv`) set ClinVar's
 * archived variant_summary releases for January 2023 and September 2026 side by
 * side and counted the variants whose classification crossed between uncertain
 * significance and the pathogenic band, in each direction. These describe ClinVar
 * as a whole, not this workspace, and are labelled "ClinVar-wide" wherever they
 * appear. Unlike the workspace's figures they are fixed: nothing at runtime
 * recomputes them.
 */

export interface ClinVarWideShift {
  /** Release identifiers, `YYYY-MM`. */
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  /** Uncertain significance in `from`, pathogenic or likely pathogenic in `to`. */
  vusToPathogenic: number;
  /** Pathogenic or likely pathogenic in `from`, uncertain significance in `to`. */
  pathogenicToVus: number;
  source: string;
  sourceUrl: string;
}

export const CLINVAR_WIDE: ClinVarWideShift = {
  from: "2023-01",
  to: "2026-09",
  fromLabel: "Jan 2023",
  toLabel: "Sep 2026",
  vusToPathogenic: 5022,
  pathogenicToVus: 1703,
  source: "NCBI ClinVar variant_summary, January 2023 and September 2026 releases compared",
  sourceUrl: "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/archive/",
};
