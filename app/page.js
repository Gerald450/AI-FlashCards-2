'use client'
import getStripe from "@/utils/get-stripe";
import { useRouter } from 'next/navigation';
import { Button, Typography, Container, Box, Grid, Card, CardContent } from "@mui/material";
import Navigation from "./components/Navigation";

export default function Home() {
  const router = useRouter();

  const handleSubmit = async () => {
    const checkoutSession = await fetch('/api/checkout_session', {
      method: 'POST',
      headers: {
        origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      },
    })

    const checkoutSessionJson = await checkoutSession.json()

    if (checkoutSession.statusCode === 500){
      console.error(checkoutSession.message)
      return
    }

    const stripe = await getStripe()
    const {error} = await stripe.redirectToCheckout({
      sessionId: checkoutSessionJson.id,
    })

    if (error){
      console.warn(error.message)
    }
  }
  
  const handleNavigation = () => {
    router.push('/generate');
  }

  return (
    <>
      <Navigation />
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            my: 8,
            py: 6,
          }}
        >
          <Typography 
            variant="h1" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome to Flashcard SaaS
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, color: 'text.secondary' }}>
            Transform your text into intelligent flashcards with AI-powered learning
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            sx={{ 
              mt: 2,
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
            }} 
            onClick={handleNavigation}
          >
            Get Started
          </Button>
        </Box>

        <Box sx={{ my: 10 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 6, fontWeight: 700 }}>
            Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', p: 3 }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Smart Flashcards
                  </Typography>
                  <Typography color="text.secondary">
                    Our AI intelligently breaks down your text into concise flashcards, 
                    perfect for studying and retention.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', p: 3 }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Accessible Anywhere
                  </Typography>
                  <Typography color="text.secondary">
                    Access your flashcards from any device, at any time. Study on the go with ease.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', p: 3 }}>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Organized Collections
                  </Typography>
                  <Typography color="text.secondary">
                    Organize your flashcards into collections and track your learning progress efficiently.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ my: 10, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ mb: 6, fontWeight: 700 }}>
            Pricing
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={5}>
              <Card sx={{ p: 4, height: '100%' }}>
                <CardContent>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                    Basic
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
                    $5 / month
                  </Typography>
                  <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                    Access to basic flashcard features and limited storage
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Choose Basic
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
              <Card 
                sx={{ 
                  p: 4, 
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: '2px solid',
                  borderColor: 'primary.main',
                }}
              >
                <CardContent>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                    Pro
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
                    $10 / month
                  </Typography>
                  <Typography sx={{ mb: 3, color: 'text.secondary' }}>
                    Unlimited flashcards and storage, with priority support.
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleSubmit}
                  >
                    Choose Pro
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
