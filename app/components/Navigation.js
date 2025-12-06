'use client'

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navigation() {
  const router = useRouter()

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              cursor: 'pointer',
              '&:hover': { opacity: 0.9 }
            }}
          >
            Flashcard SaaS
          </Typography>
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SignedOut>
            <Button 
              color="inherit" 
              component={Link}
              href="/sign-in"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Login
            </Button>
            <Button 
              color="inherit" 
              component={Link}
              href="/sign-up"
              variant="outlined"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': { 
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Sign Up
            </Button>
          </SignedOut>
          <SignedIn>
            <Button 
              color="inherit" 
              component={Link}
              href="/flashcards"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                mr: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              My Flashcards
            </Button>
            <Button 
              color="inherit" 
              component={Link}
              href="/generate"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                mr: 2,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Generate
            </Button>
            <UserButton />
          </SignedIn>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

