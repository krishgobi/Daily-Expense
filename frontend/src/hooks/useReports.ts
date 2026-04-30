import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reportService, { Report } from '../services/reportService'

export const useReports = (limit: number = 20, offset: number = 0) => {
  const queryClient = useQueryClient()

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['reports', limit, offset],
    queryFn: () => reportService.getReports(limit, offset),
  })

  const generateMutation = useMutation({
    mutationFn: (data: {
      reportType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
      periodStart: string
      periodEnd: string
      format: 'PDF' | 'EXCEL' | 'WORD'
    }) =>
      reportService.generateReport(data.reportType, data.periodStart, data.periodEnd, data.format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (id: string) => reportService.downloadReport(id),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  return {
    reports: result?.data || [],
    total: result?.meta.total || 0,
    isLoading,
    error,
    generateReport: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    downloadReport: downloadMutation.mutate,
    isDownloading: downloadMutation.isPending,
    deleteReport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
