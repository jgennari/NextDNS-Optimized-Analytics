import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ProfileSelector } from '@/components/ProfileSelector'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState } from '@/components/LoadingSkeletons'
import { fetchWithAuth } from '@/lib/api'

type QueryRow = {
  day: string
  device_id: string | null
  device_name: string | null
  hostname: string
  query_count: number
}

type QueryPage = { data: QueryRow[]; has_more: boolean }

const pageSize = 100
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const dayFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'long',
  timeZone: 'UTC',
})

export function WebQueries({ initialProfile }: { initialProfile?: string }) {
  const [days, setDays] = useState(7)
  const [profile, setProfile] = useState(initialProfile)
  const [page, setPage] = useState(0)

  const { data, isPending, isFetching, isError, refetch } = useQuery({
    queryKey: ['web-query-groups', days, profile, page, timeZone],
    queryFn: async ({ signal }): Promise<QueryPage> => {
      const params = new URLSearchParams({
        days: String(days),
        time_zone: timeZone,
        limit: String(pageSize),
        offset: String(page * pageSize),
      })
      if (profile) params.set('profile', profile)
      const response = await fetchWithAuth(`/api/logs/web-queries?${params}`, {
        signal,
      })
      if (!response.ok) throw new Error('Unable to load queries')
      return response.json()
    },
  })

  const groups = new Map<string, QueryRow[]>()
  for (const row of data?.data ?? []) {
    const key = JSON.stringify([
      row.day,
      row.device_id,
      row.device_id ? null : row.device_name,
    ])
    const rows = groups.get(key)
    if (rows) rows.push(row)
    else groups.set(key, [row])
  }

  return (
    <section className="space-y-4" aria-label="Queries by day and device">
      <p className="text-sm text-muted-foreground">
        Includes queries to bare domains and their exact www hostnames. Dates
        use {timeZone}.
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <ProfileSelector
          selectedProfile={profile}
          onProfileChange={value => {
            setProfile(value)
            setPage(0)
          }}
        />
        <label className="flex flex-col gap-2 text-sm font-medium">
          Time range
          <select
            className="h-9 rounded-md border bg-background px-3"
            value={days}
            onChange={event => {
              setDays(Number(event.target.value))
              setPage(0)
            }}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          Refresh
        </Button>
      </div>
      {isPending && <LoadingState />}
      {isError && (
        <ErrorState
          message="Failed to load grouped queries"
          onRetry={refetch}
        />
      )}
      {data && (
        <>
          {groups.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matching queries in this range.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left">
                      Queried hostname
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Queries
                    </th>
                  </tr>
                </thead>
                {Array.from(groups, ([key, rows]) => (
                  <tbody key={key}>
                    <tr className="border-y bg-muted/40">
                      <th
                        scope="rowgroup"
                        colSpan={2}
                        className="px-4 py-2 text-left"
                      >
                        {dayFormat.format(new Date(rows[0].day))} ·{' '}
                        {rows.find(row => row.device_name)?.device_name ??
                          rows[0].device_id ??
                          'Unidentified device'}
                      </th>
                    </tr>
                    {rows.map(row => (
                      <tr
                        key={row.hostname}
                        className="border-b last:border-b-0"
                      >
                        <td className="break-all px-4 py-2">{row.hostname}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {row.query_count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">Page {page + 1}</span>
            <Button
              variant="outline"
              disabled={!data.has_more}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
