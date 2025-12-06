'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Box, CircularProgress, Container, Typography, Card, CardContent, Button } from "@mui/material"
import Navigation from "../components/Navigation"

const ResultPage = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const session_id = searchParams.get('session_id')

    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCheckoutSession = async () => {
            if (!session_id) {
                setError('No session ID provided')
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`/api/checkout_session?session_id=${session_id}`)
                if (!res.ok) {
                    throw new Error('Failed to fetch session data')
                }
                const sessionData = await res.json()
                setSession(sessionData)
            } catch (err) {
                console.error(err)
                setError('An error occurred while fetching the session data.')
            } finally {
                setLoading(false)
            }
        }

        fetchCheckoutSession()
    }, [session_id])

    if (loading) {
        return (
            <>
                <Navigation />
                <Container
                    maxWidth="lg"
                    sx={{
                        textAlign: 'center',
                        mt: 8,
                        minHeight: '50vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ mt: 3 }}>Loading...</Typography>
                </Container>
            </>
        )
    }

    return (
        <>
            <Navigation />
            <Container
                maxWidth="lg"
                sx={{
                    textAlign: 'center',
                    mt: 8,
                    mb: 8,
                }}
            >
                <Card sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
                    <CardContent>
                        {error ? (
                            <>
                                <Typography variant="h4" sx={{ mb: 3, color: 'error.main' }}>
                                    Error
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                                    {error}
                                </Typography>
                                <Button variant="contained" onClick={() => router.push('/')}>
                                    Go Home
                                </Button>
                            </>
                        ) : session?.payment_status === 'paid' ? (
                            <>
                                <Typography 
                                    variant="h4" 
                                    sx={{ 
                                        mb: 3,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    Thank you for your purchase!
                                </Typography>
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                                        We have received your payment. You will receive an email with the
                                        order details shortly.
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                                        Session ID: {session_id}
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        size="large"
                                        onClick={() => router.push('/generate')}
                                    >
                                        Start Creating Flashcards
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Typography variant="h4" sx={{ mb: 3, color: 'error.main' }}>
                                    Payment Failed
                                </Typography>
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                                        Your payment was not successful. Please try again.
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        size="large"
                                        onClick={() => router.push('/')}
                                    >
                                        Return to Home
                                    </Button>
                                </Box>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </>
    )
}

export default ResultPage
