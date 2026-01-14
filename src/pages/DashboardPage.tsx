import React, { useEffect, useState } from 'react'
import { useAuth } from '@/core/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import MainSidebar from '../components/layout/MainSidebar'
import { supabase } from '@/core/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'
import { TimeRangeSelector } from '../components/ui/TimeRangeSelector/TimeRangeSelector'
import type { Message } from '@/core/types/database.types'
import { fetchDashboardStats, fetchReportData, type TimeRange } from '@/core/services/analyticsService'
import './DashboardPage.css'
import MenuIcon from '@/img/menu-icon.svg?react'
import ChatAltIcon from '@/img/chat-alt-icon.svg?react'
import UsersIcon from '@/img/users-icon.svg?react'
import DownloadPdfIcon from '@/img/download-pdf-icon.svg?react'
import CloseIcon from '@/img/close-icon.svg?react'
import ExpandIcon from '@/img/expand-icon.svg?react'

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
      if (!clientData?.id) throw new Error('No client data')

      const { conversations, leads } = await fetchReportData(clientData.id, reportStartDate, reportEndDate)

      // Process data
      const allMessages = conversations?.flatMap(conv => conv.messages || []) || []
      const channelCounts = conversations?.reduce((acc: any, conv) => {
        const channel = conv.channel || 'unknown'
        acc[channel] = (acc[channel] || 0) + 1
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
        body: channelData as any[],
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
        body: senderData as any[],
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
        setIsLoading(true)
        const newStats = await fetchDashboardStats(clientData.id, timeRange)
        setStats(newStats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()

    // Real-time messages subscription

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

          if (!newMessage.conversation_id) return

          // Verify message belongs to this client's conversations
          const { data: conversation } = await supabase
            .from('conversations')
            .select('platform_client_id')
            .eq('id', newMessage.conversation_id)
            .single()

          if (conversation?.platform_client_id === clientData.id) {
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
  }, [clientData?.id, timeRange])

  return (
    <div className="dashboard-page">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="mobile-sidebar-toggle"
      >
        <MenuIcon />
      </button>

      {/* Main Sidebar */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        {isMobileSidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="sidebar-container">
          <MainSidebar onChannelSelect={handleChannelSelect} />
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="page-header">
          <h2>Dashboard</h2>
          <p>
            Panoramica del tuo account e statistiche
          </p>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              {/* Total Messages */}
              <div className="stats-card">
                <div className="card-content">
                  <div>
                    <p className="label">Messaggi Totali</p>
                    <p className="value">{stats.totalMessages}</p>
                  </div>
                  <div className="icon-wrapper green">
                    <ChatAltIcon />
                  </div>
                </div>
              </div>

              {/* Total Leads */}
              <div className="stats-card">
                <div className="card-content">
                  <div>
                    <p className="label">Lead Totali</p>
                    <p className="value">{stats.totalLeads}</p>
                  </div>
                  <div className="icon-wrapper purple">
                    <UsersIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Report Summary Section */}
            <div className="report-section">
              <div className="section-header">
                <div>
                  <h3>Riepilogo Periodo Attuale</h3>
                  <p>
                    Statistiche per: {timeRange === '7d' ? 'Ultimi 7 Giorni' : timeRange === '1m' ? 'Ultimo Mese' : timeRange === '3m' ? 'Ultimi 3 Mesi' : timeRange === '6m' ? 'Ultimi 6 Mesi' : 'Ultimo Anno'}
                  </p>
                </div>
                <div className="live-indicator">
                  <div className="dot-wrapper">
                    <span className="ping"></span>
                    <span className="dot"></span>
                  </div>
                  <span className="text">Real-time</span>
                </div>
              </div>

              {/* Live Statistics Grid */}
              <div className="live-stats-row">
                <div className="stat-item">
                  <p className="label">Messaggi Periodo</p>
                  <p className="value">
                    {stats.messagesLast7Days.reduce((sum, day) => sum + day.messages, 0)}
                  </p>
                </div>
                <div className="stat-item">
                  <p className="label">Messaggi Totali</p>
                  <p className="value">{stats.totalMessages}</p>
                </div>
                <div className="stat-item">
                  <p className="label">Conversazioni</p>
                  <p className="value">{stats.totalConversations}</p>
                </div>
                <div className="stat-item">
                  <p className="label">Nuovi Lead</p>
                  <p className="value">{stats.totalLeads}</p>
                </div>
                <div className="stat-item">
                  <p className="label">Media/Giorno</p>
                  <p className="value">
                    {stats.messagesLast7Days.length > 0
                      ? Math.round(stats.messagesLast7Days.reduce((sum, day) => sum + day.messages, 0) / stats.messagesLast7Days.length)
                      : 0}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="breakdown-row">
                {/* Conversazioni per Canale */}
                <div className="breakdown-card">
                  <h4>Conversazioni per Canale</h4>
                  <div className="list">
                    {stats.conversationsByChannel.map((channel, index) => (
                      <div key={index} className="item">
                        <span className="name">{channel.name}</span>
                        <span className="count">{channel.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Messaggi per Tipo */}
                <div className="breakdown-card">
                  <h4>Messaggi per Tipo</h4>
                  <div className="list">
                    {stats.messagesBySender.map((sender, index) => (
                      <div key={index} className="item">
                        <span className="name">{sender.name}</span>
                        <span className="count">{sender.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="export-footer">
                <div className="title-row">
                  <p>Esporta Report Personalizzato</p>
                </div>
                <div className="controls-grid">
                  <div className="input-group">
                    <label>Data Inizio</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Data Fine</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                  <div className="btn-container">
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="button primary"
                    >
                      {isGeneratingReport ? (
                        <>
                          <div className="spinner-small"></div>
                          <span>Generazione...</span>
                        </>
                      ) : (
                        <>
                          <DownloadPdfIcon className="icon" />
                          <span>Scarica PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="time-range-wrapper">
              <div className="header">
                <h3>Periodo di Visualizzazione</h3>
              </div>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              {/* Messages Chart */}
              <div className={`chart-card ${expandedCharts.includes('messages') ? 'expanded' : ''}`}>
                <div className="chart-header">
                  <div className="title-group">
                    <h3>
                      Messaggi - {timeRange === '7d' ? 'Ultimi 7 Giorni' : timeRange === '1m' ? 'Ultimo Mese' : timeRange === '3m' ? 'Ultimi 3 Mesi' : timeRange === '6m' ? 'Ultimi 6 Mesi' : 'Ultimo Anno'}
                    </h3>
                    <div className="live-indicator">
                      <div className="dot-wrapper">
                        <span className="ping"></span>
                        <span className="dot"></span>
                      </div>
                      <span className="text">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('messages')}
                    className="expand-btn"
                    title={expandedCharts.includes('messages') ? 'Riduci' : 'Espandi'}
                  >
                    {expandedCharts.includes('messages') ? <CloseIcon /> : <ExpandIcon />}
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
              <div className={`chart-card ${expandedCharts.includes('channels') ? 'expanded' : ''}`}>
                <div className="chart-header">
                  <div className="title-group">
                    <h3>Conversazioni per Canale</h3>
                    <div className="live-indicator">
                      <div className="dot-wrapper">
                        <span className="ping"></span>
                        <span className="dot"></span>
                      </div>
                      <span className="text">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('channels')}
                    className="expand-btn"
                    title={expandedCharts.includes('channels') ? 'Riduci' : 'Espandi'}
                  >
                    {expandedCharts.includes('channels') ? <CloseIcon /> : <ExpandIcon />}
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={expandedCharts.includes('channels') ? 500 : 300}>
                  <PieChart>
                    <Pie
                      data={stats.conversationsByChannel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
              <div className={`chart-card ${expandedCharts.includes('sender') ? 'expanded' : ''}`}>
                <div className="chart-header">
                  <div className="title-group">
                    <h3>Messaggi per Tipo</h3>
                    <div className="live-indicator">
                      <div className="dot-wrapper">
                        <span className="ping"></span>
                        <span className="dot"></span>
                      </div>
                      <span className="text">Live</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChartExpansion('sender')}
                    className="expand-btn"
                    title={expandedCharts.includes('sender') ? 'Riduci' : 'Espandi'}
                  >
                    {expandedCharts.includes('sender') ? <CloseIcon /> : <ExpandIcon />}
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

            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardPage
