import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import type { Message } from '../types/database.types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'
import { TimeRangeSelector, type TimeRange } from '../components/ui/TimeRangeSelector/TimeRangeSelector'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

const DashboardPage: React.FC = () => {
  const { user, clientData } = useAuth()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalLeads: 0,
    conversationsByChannel: [] as { name: string; value: number }[],
    messagesBySender: [] as { name: string; value: number }[],
    messagesLast7Days: [] as { date: string; messages: number }[]
  })
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [expandedCharts, setExpandedCharts] = useState<string[]>([])

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
  }

  const toggleChartExpansion = (chartId: string) => {
    setExpandedCharts(prev =>
      prev.includes(chartId)
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    )
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate date range based on timeRange selection
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()

    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 6)
        break
      case '1m':
        start.setMonth(end.getMonth() - 1)
        break
      case '3m':
        start.setMonth(end.getMonth() - 3)
        break
      case '6m':
        start.setMonth(end.getMonth() - 6)
        break
      case '1y':
        start.setFullYear(end.getFullYear() - 1)
        break
    }

    return { start, end }
  }, [timeRange])

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const generateReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      toast.error('Seleziona entrambe le date per generare il report')
      return
    }

    if (new Date(reportStartDate) > new Date(reportEndDate)) {
      toast.error('La data di inizio deve essere precedente alla data di fine')
      return
    }

    setIsGeneratingReport(true)

    try {
      // Fetch data for the selected period
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('platform_client_id', clientData?.id || '')
        .gte('started_at', reportStartDate)
        .lte('started_at', reportEndDate + 'T23:59:59')

      if (convError) throw convError

      const { data: leads, error: leadsError } = await supabase
        .from('social_contacts')
        .select('*')
        .eq('platform_client_id', clientData?.id || '')
        .gte('first_contact', reportStartDate)
        .lte('first_contact', reportEndDate + 'T23:59:59')

      if (leadsError) throw leadsError

      // Process data
      const allMessages = conversations?.flatMap(conv => conv.messages || []) || []
      const channelCounts = conversations?.reduce((acc: any, conv) => {
        acc[conv.channel] = (acc[conv.channel] || 0) + 1
        return acc
      }, {})

      const senderCounts = allMessages.reduce((acc: any, msg) => {
        const type = msg.sender_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      // Generate PDF
      const doc = new jsPDF()

      // Title
      doc.setFontSize(20)
      doc.text('Report Chatly', 14, 20)

      // Date range
      doc.setFontSize(12)
      doc.text(`Periodo: ${new Date(reportStartDate).toLocaleDateString('it-IT')} - ${new Date(reportEndDate).toLocaleDateString('it-IT')}`, 14, 30)

      // Business info
      doc.setFontSize(10)
      doc.text(`Business: ${clientData?.business_name || 'N/A'}`, 14, 38)
      doc.text(`Email: ${user?.email || 'N/A'}`, 14, 44)

      // Summary statistics
      doc.setFontSize(14)
      doc.text('Statistiche Riepilogative', 14, 56)

      autoTable(doc, {
        startY: 62,
        head: [['Metrica', 'Valore']],
        body: [
          ['Conversazioni Totali', conversations?.length || 0],
          ['Messaggi Totali', allMessages.length],
          ['Nuovi Lead', leads?.length || 0],
        ],
      })

      // Conversations by channel
      const currentY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.text('Conversazioni per Canale', 14, currentY)

      const channelData = Object.entries(channelCounts || {}).map(([channel, count]) => [
        channel.charAt(0).toUpperCase() + channel.slice(1),
        count
      ])

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Canale', 'Numero Conversazioni']],
        body: channelData,
      })

      // Messages by sender type
      const currentY2 = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(14)
      doc.text('Messaggi per Tipo', 14, currentY2)

      const senderData = Object.entries(senderCounts).map(([type, count]) => {
        const label = type === 'user' ? 'Cliente' : type === 'human_agent' ? 'Agente' : type === 'bot' ? 'Bot' : type === 'ai' ? 'AI Assistant' : 'Sistema'
        return [label, count]
      })

      autoTable(doc, {
        startY: currentY2 + 6,
        head: [['Tipo Mittente', 'Numero Messaggi']],
        body: senderData,
      })

      // Save PDF
      const fileName = `report_chatly_${reportStartDate}_${reportEndDate}.pdf`
      doc.save(fileName)

      toast.success('Report generato con successo!')
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error('Errore durante la generazione del report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  useEffect(() => {
    if (!clientData?.id) return

    const fetchStats = async () => {
      try {
        // Fetch ONLY conversations count and data (without messages) - MUCH FASTER
        const { data: conversations, error: convError, count: totalConversations } = await supabase
          .from('conversations')
          .select('id, channel', { count: 'exact' })
          .eq('platform_client_id', clientData.id)

        if (convError) throw convError

        // Count leads
        const { count: totalLeads, error: leadsError } = await supabase
          .from('social_contacts')
          .select('id', { count: 'exact', head: true })
          .eq('platform_client_id', clientData.id)

        if (leadsError) throw leadsError

        // Count total messages - much faster than loading all
        const { count: totalMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversations?.map(c => c.id) || [])

        if (messagesError) throw messagesError

        // Process conversations by channel
        const channelCounts = conversations?.reduce((acc: any, conv) => {
          acc[conv.channel] = (acc[conv.channel] || 0) + 1
          return acc
        }, {})

        const conversationsByChannel = Object.entries(channelCounts || {}).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: value as number
        }))

        // Fetch ONLY recent messages for sender type stats (last 100 instead of ALL)
        const { data: recentMessagesForStats } = await supabase
          .from('messages')
          .select('sender_type')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .order('created_at', { ascending: false })
          .limit(100)

        // Messages by sender type
        const senderCounts = recentMessagesForStats?.reduce((acc: any, msg) => {
          const type = msg.sender_type || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {}) || {}

        const messagesBySender = Object.entries(senderCounts).map(([name, value]) => ({
          name: name === 'user' ? 'Cliente' : name === 'human_agent' ? 'Agente' : name === 'bot' ? 'Bot' : name === 'ai' ? 'AI Assistant' : 'Sistema',
          value: value as number
        }))

        // Messages for selected time range - dynamic based on timeRange
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)

        // Calculate number of data points based on range
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        // Determine the grouping interval
        let intervals: { start: Date; end: Date; label: string }[] = []

        if (timeRange === '7d') {
          // Daily for 7 days
          intervals = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            return {
              start: new Date(date.setHours(0, 0, 0, 0)),
              end: new Date(date.setHours(23, 59, 59, 999)),
              label: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
            }
          })
        } else if (timeRange === '1m') {
          // Daily for 1 month (30 days)
          const days = 30
          intervals = Array.from({ length: days }, (_, i) => {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            return {
              start: new Date(date.setHours(0, 0, 0, 0)),
              end: new Date(date.setHours(23, 59, 59, 999)),
              label: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
            }
          })
        } else {
          // Weekly aggregation for 3m, 6m, 1y
          const weeks = Math.ceil(daysDiff / 7)
          intervals = Array.from({ length: weeks }, (_, i) => {
            const weekStart = new Date(start)
            weekStart.setDate(start.getDate() + (i * 7))
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            return {
              start: weekStart,
              end: weekEnd > end ? end : weekEnd,
              label: weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
            }
          })
        }

        // Fetch messages for the entire range
        const { data: rangeMessages } = await supabase
          .from('messages')
          .select('created_at')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true })

        const messagesLast7Days = intervals.map(interval => {
          const count = rangeMessages?.filter(msg => {
            if (!msg.created_at) return false
            const msgDate = new Date(msg.created_at)
            return msgDate >= interval.start && msgDate <= interval.end
          }).length || 0
          return {
            date: interval.label,
            messages: count
          }
        })

        setStats({
          totalConversations: totalConversations || 0,
          totalMessages: totalMessages || 0,
          totalLeads: totalLeads || 0,
          conversationsByChannel,
          messagesBySender,
          messagesLast7Days
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Real-time messages subscription
    const fetchRecentMessages = async () => {
      // Get messages only from conversations of this client
      const { data: clientConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('platform_client_id', clientData.id)

      const conversationIds = clientConversations?.map(c => c.id) || []

      if (conversationIds.length > 0) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false })
          .limit(20)

        if (data) setRecentMessages(data)
      }
    }

    fetchRecentMessages()

    const messagesChannel = supabase
      .channel('dashboard-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message

          // Verify message belongs to this client's conversations
          const { data: conversation } = await supabase
            .from('conversations')
            .select('platform_client_id')
            .eq('id', newMessage.conversation_id)
            .single()

          if (conversation?.platform_client_id === clientData.id) {
            setRecentMessages(prev => [newMessage, ...prev].slice(0, 20))

            // Real-time stats update
            setStats(prevStats => {
              // Update total messages
              const newTotalMessages = prevStats.totalMessages + 1

              // Update messages chart - add to today's count
              const today = new Date().toISOString().split('T')[0]
              const todayFormatted = new Date(today).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })

              const updatedMessagesChart = prevStats.messagesLast7Days.map(day => {
                if (day.date === todayFormatted) {
                  return { ...day, messages: day.messages + 1 }
                }
                return day
              })

              // Update messages by sender type
              const senderType = newMessage.sender_type || 'unknown'
              const senderLabel = senderType === 'user' ? 'Cliente' :
                                 senderType === 'human_agent' ? 'Agente' :
                                 senderType === 'bot' ? 'Bot' :
                                 senderType === 'ai' ? 'AI Assistant' : 'Sistema'

              const updatedMessagesBySender = prevStats.messagesBySender.map(sender => {
                if (sender.name === senderLabel) {
                  return { ...sender, value: sender.value + 1 }
                }
                return sender
              })

              // If sender type doesn't exist, add it
              const senderExists = updatedMessagesBySender.some(s => s.name === senderLabel)
              if (!senderExists) {
                updatedMessagesBySender.push({ name: senderLabel, value: 1 })
              }

              return {
                ...prevStats,
                totalMessages: newTotalMessages,
                messagesLast7Days: updatedMessagesChart,
                messagesBySender: updatedMessagesBySender
              }
            })
          }
        }
      )
      .subscribe()

    // Subscribe to new conversations
    const conversationsChannel = supabase
      .channel('dashboard-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `platform_client_id=eq.${clientData.id}`
        },
        (payload) => {
          const newConversation = payload.new as any

          setStats(prevStats => {
            // Increment total conversations
            const newTotalConversations = prevStats.totalConversations + 1

            // Update conversations by channel
            const channelName = newConversation.channel.charAt(0).toUpperCase() + newConversation.channel.slice(1)
            const updatedConversationsByChannel = prevStats.conversationsByChannel.map(ch => {
              if (ch.name === channelName) {
                return { ...ch, value: ch.value + 1 }
              }
              return ch
            })

            // If channel doesn't exist, add it
            const channelExists = updatedConversationsByChannel.some(c => c.name === channelName)
            if (!channelExists) {
              updatedConversationsByChannel.push({ name: channelName, value: 1 })
            }

            return {
              ...prevStats,
              totalConversations: newTotalConversations,
              conversationsByChannel: updatedConversationsByChannel
            }
          })
        }
      )
      .subscribe()

    // Subscribe to new leads
    const leadsChannel = supabase
      .channel('dashboard-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_contacts',
          filter: `platform_client_id=eq.${clientData.id}`
        },
        (payload) => {
          // Real-time stats update: increment total leads (only for master contacts)
          const newContact = payload.new as any
          if (newContact.master_contact_id === null) {
            setStats(prevStats => ({
              ...prevStats,
              totalLeads: prevStats.totalLeads + 1
            }))
          }
        }
      )
      .subscribe()

    return () => {
      messagesChannel.unsubscribe()
      conversationsChannel.unsubscribe()
      leadsChannel.unsubscribe()
    }
  }, [clientData?.id, dateRange, timeRange])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-md shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative inset-0 lg:inset-auto z-40`}>
        {isMobileSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="relative">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Panoramica del tuo account e statistiche
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Total Messages */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Messaggi Totali</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalMessages}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Leads */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lead Totali</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Summary Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Riepilogo Periodo Attuale</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Statistiche per: {timeRange === '7d' ? 'Ultimi 7 Giorni' : timeRange === '1m' ? 'Ultimo Mese' : timeRange === '3m' ? 'Ultimi 3 Mesi' : timeRange === '6m' ? 'Ultimi 6 Mesi' : 'Ultimo Anno'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm text-gray-600">Real-time</span>
                </div>
              </div>

              {/* Live Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Messaggi Periodo</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {stats.messagesLast7Days.reduce((sum, day) => sum + day.messages, 0)}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Messaggi Totali</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversazioni</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nuovi Lead</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Media/Giorno</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {stats.messagesLast7Days.length > 0
                      ? Math.round(stats.messagesLast7Days.reduce((sum, day) => sum + day.messages, 0) / stats.messagesLast7Days.length)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Conversazioni per Canale */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Conversazioni per Canale</p>
                  <div className="space-y-2">
                    {stats.conversationsByChannel.map((channel, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{channel.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{channel.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messaggi per Tipo */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Messaggi per Tipo</p>
                  <div className="space-y-2">
                    {stats.messagesBySender.map((sender, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{sender.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{sender.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Esporta Report Personalizzato</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Data Inizio</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Data Fine</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Generazione...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Scarica PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Periodo di Visualizzazione</h3>
              </div>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Messages Chart */}
              <div className={`bg-white rounded-lg shadow p-6 ${expandedCharts.includes('messages') ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Messaggi - {timeRange === '7d' ? 'Ultimi 7 Giorni' : timeRange === '1m' ? 'Ultimo Mese' : timeRange === '3m' ? 'Ultimi 3 Mesi' : timeRange === '6m' ? 'Ultimi 6 Mesi' : 'Ultimo Anno'}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-gray-500">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('messages')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedCharts.includes('messages') ? 'Riduci' : 'Espandi'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {expandedCharts.includes('messages') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={expandedCharts.includes('messages') ? 500 : 300}>
                  <LineChart data={stats.messagesLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Conversations by Channel */}
              <div className={`bg-white rounded-lg shadow p-6 ${expandedCharts.includes('channels') ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Conversazioni per Canale</h3>
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-gray-500">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('channels')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedCharts.includes('channels') ? 'Riduci' : 'Espandi'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {expandedCharts.includes('channels') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={expandedCharts.includes('channels') ? 500 : 300}>
                  <PieChart>
                    <Pie
                      data={stats.conversationsByChannel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={expandedCharts.includes('channels') ? 150 : 80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.conversationsByChannel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Messages by Sender */}
              <div className={`bg-white rounded-lg shadow p-6 ${expandedCharts.includes('sender') ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Messaggi per Tipo</h3>
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-gray-500">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('sender')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedCharts.includes('sender') ? 'Riduci' : 'Espandi'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {expandedCharts.includes('sender') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={expandedCharts.includes('sender') ? 500 : 300}>
                  <BarChart data={stats.messagesBySender}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Real-time Messages Log */}
              <div className={`bg-white rounded-lg shadow p-6 ${expandedCharts.includes('logs') ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">Log Messaggi Real-Time</h3>
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-gray-500">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('logs')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title={expandedCharts.includes('logs') ? 'Riduci' : 'Espandi'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {expandedCharts.includes('logs') ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      )}
                    </svg>
                  </button>
                </div>
                <div className={`space-y-2 overflow-y-auto ${expandedCharts.includes('logs') ? 'max-h-[600px]' : 'max-h-[300px]'}`}>
                  {recentMessages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Nessun messaggio recente</p>
                  ) : (
                    recentMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className={`p-2 rounded-full ${
                          msg.sender_type === 'user' ? 'bg-blue-100' :
                          msg.sender_type === 'human_agent' ? 'bg-green-100' :
                          msg.sender_type === 'bot' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-900">
                              {msg.sender_type === 'user' ? 'Cliente' : msg.sender_type === 'human_agent' ? 'Agente' : msg.sender_type === 'bot' ? 'Bot' : 'Sistema'}
                            </p>
                            <p className="text-xs text-gray-500">{formatTime(msg.created_at)}</p>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">{msg.content_text || '[Media]'}</p>
                          <p className="text-xs text-gray-400 mt-1">{msg.direction === 'inbound' ? 'Ricevuto' : 'Inviato'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardPage
