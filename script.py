"""Helper script"""
import sqlite3
import pandas as pd
import pathlib


DB = pathlib.Path('FPA_FOD_20170508.sqlite')
CON = sqlite3.connect(DB)


def query(sql):
    return pd.read_sql_query(sql, CON)


def visualize():
    print(query("SELECT name FROM sqlite_master WHERE type='table';"))
    query("SELECT * FROM Fires").to_csv('tmp_Fires.csv', index=False)


def main():
    out_dir = pathlib.Path('data')
    out_dir.mkdir(exist_ok=True)

    query('''
    WITH base AS (
        SELECT FIRE_YEAR AS year, FIRE_SIZE AS size
        FROM Fires
        WHERE FIRE_SIZE IS NOT NULL
    ),
    agg AS (
        SELECT year, COUNT(*) AS fires, SUM(size) AS acres
        FROM base
        GROUP BY year
    ),
    ordered AS (
        SELECT year, size,
               ROW_NUMBER() OVER (PARTITION BY year ORDER BY size) AS rn_asc,
               COUNT(*) OVER (PARTITION BY year) AS n
        FROM base
    ),
    median AS (
        SELECT year, AVG(size) AS median_size
        FROM ordered
        WHERE rn_asc IN ( (n + 1) / 2, (n + 2) / 2 )
        GROUP BY year
    )
    SELECT agg.year, agg.fires, agg.acres, median.median_size
    FROM agg JOIN median USING (year)
    ORDER BY agg.year;
    ''').to_csv(out_dir / 'national_year.csv', index=False)

    query('''
    WITH base AS (
        SELECT STATE AS state, FIRE_YEAR AS year, FIRE_SIZE AS size
        FROM Fires
        WHERE FIRE_SIZE IS NOT NULL
    ),
    agg AS (
        SELECT state, year, COUNT(*) AS fires, SUM(size) AS acres
        FROM base
        GROUP BY state, year
    ),
    ordered AS (
        SELECT state, year, size,
               ROW_NUMBER() OVER (PARTITION BY state, year ORDER BY size) AS rn_asc,
               COUNT(*) OVER (PARTITION BY state, year) AS n
        FROM base
    ),
    median AS (
        SELECT state, year, AVG(size) AS median_size
        FROM ordered
        WHERE rn_asc IN ( (n + 1) / 2, (n + 2) / 2 )
        GROUP BY state, year
    )
    SELECT agg.state, agg.year, agg.fires, agg.acres, median.median_size
    FROM agg JOIN median USING (state, year)
    ORDER BY agg.state, agg.year;
    ''').to_csv(out_dir / 'state_year.csv', index=False)

    query('''
    WITH base AS (
        SELECT STAT_CAUSE_DESCR AS cause, FIRE_YEAR AS year, FIRE_SIZE AS size
        FROM Fires
        WHERE FIRE_SIZE IS NOT NULL
    ),
    agg AS (
        SELECT cause, year, COUNT(*) AS fires, SUM(size) AS acres
        FROM base
        GROUP BY cause, year
    ),
    ordered AS (
        SELECT cause, year, size,
               ROW_NUMBER() OVER (PARTITION BY cause, year ORDER BY size) AS rn_asc,
               COUNT(*) OVER (PARTITION BY cause, year) AS n
        FROM base
    ),
    median AS (
        SELECT cause, year, AVG(size) AS median_size
        FROM ordered
        WHERE rn_asc IN ( (n + 1) / 2, (n + 2) / 2 )
        GROUP BY cause, year
    )
    SELECT agg.cause, agg.year, agg.fires, agg.acres, median.median_size
    FROM agg JOIN median USING (cause, year)
    ORDER BY agg.cause, agg.year;
    ''').to_csv(out_dir / 'cause_year.csv', index=False)

    query('''
    WITH base AS (
        SELECT STATE AS state, STAT_CAUSE_DESCR AS cause, FIRE_YEAR AS year, FIRE_SIZE AS size
        FROM Fires
        WHERE FIRE_SIZE IS NOT NULL
    ),
    agg AS (
        SELECT state, cause, year, COUNT(*) AS fires, SUM(size) AS acres
        FROM base
        GROUP BY state, cause, year
    ),
    ordered AS (
        SELECT state, cause, year, size,
            ROW_NUMBER() OVER (PARTITION BY state, cause, year ORDER BY size) AS rn_asc,
            COUNT(*) OVER (PARTITION BY state, cause, year) AS n
        FROM base
    ),
    median AS (
        SELECT state, cause, year, AVG(size) AS median_size
        FROM ordered
        WHERE rn_asc IN ( (n + 1) / 2, (n + 2) / 2 )
        GROUP BY state, cause, year
    )
    SELECT agg.state, agg.cause, agg.year, agg.fires, agg.acres, median.median_size
    FROM agg JOIN median USING (state, cause, year)
    ORDER BY agg.state, agg.cause, agg.year;
    ''').to_csv(out_dir / 'state_cause_year.csv', index=False)


if __name__ == '__main__':
    main()
    CON.close()
