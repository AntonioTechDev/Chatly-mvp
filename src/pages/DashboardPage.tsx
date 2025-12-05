import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/MainSidebar'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import type { Message } from '../types/database.types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

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

  const handleChannelSelect = (channel: 'whatsapp' | 'instagram' | 'messenger' | null) => {
    if (channel) {
      navigate('/inbox', { state: { selectedChannel: channel } })
    }
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

        // Messages last 7 days - optimized with single query
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - i))
          return date.toISOString().split('T')[0]
        })

        // Fetch messages from last 7 days with a single query
        const sevenDaysAgo = last7Days[0]
        const { data: last7DaysMessages } = await supabase
          .from('messages')
          .select('created_at')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true })

        const messagesLast7Days = last7Days.map(date => {
          const count = last7DaysMessages?.filter(msg =>
            msg.created_at?.startsWith(date)
          ).length || 0
          return {
            date: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
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

    const channel = supabase
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
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [clientData?.id])

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Total Conversations */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversazioni Totali</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalConversations}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>

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

            {/* Report PDF Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Genera Report PDF</h3>
              <p className="text-sm text-gray-600 mb-4">
                Seleziona il periodo per generare un report dettagliato delle tue statistiche
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Inizio
                  </label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Fine
                  </label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generateReport}
                    disabled={isGeneratingReport}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Generazione...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Genera Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Messages Last 7 Days */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Messaggi Ultimi 7 Giorni</h3>
                <ResponsiveContainer width="100%" height={300}>
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
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversazioni per Canale</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.conversationsByChannel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Messaggi per Tipo</h3>
                <ResponsiveContainer width="100%" height={300}>
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
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Log Messaggi Real-Time</h3>
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
