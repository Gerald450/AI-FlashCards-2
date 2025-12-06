'use client'
import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { doc, getDoc, setDoc, collection } from "firebase/firestore"
import { db } from "@/firebase"
import { useRouter } from 'next/navigation'
import { Card, CardActionArea, CardContent, Container, Grid, Typography, Box, CircularProgress, Button } from "@mui/material"
import Navigation from "../components/Navigation"

export default function Flashcards() {
    const { isLoaded, isSignedIn, user } = useUser()
    const [flashcards, setFlashcards] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function getFlashcards() {
            if (!user) {
                setLoading(false)
                return
            }
            try {
                const docRef = doc(collection(db, 'users'), user.id)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    const collections = docSnap.data().flashcards || []
                    setFlashcards(collections)
                } else {
                    await setDoc(docRef, { flashcards: [] })
                    setFlashcards([])
                }
            } catch (error) {
                console.error('Error fetching flashcards:', error)
            } finally {
                setLoading(false)
            }
        }
        getFlashcards()
    }, [user])

    if (!isLoaded) {
        return (
            <>
                <Navigation />
                <Container maxWidth='lg'>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </>
        )
    }

    if (!isSignedIn) {
        router.push('/sign-in')
        return null
    }

    const handleCardClick = (name) => {
        router.push(`/flashcard?id=${name}`)
    }

    return (
        <>
            <Navigation />
            <Container maxWidth="lg">
                <Box sx={{ mt: 4, mb: 6 }}>
                    <Typography variant="h3" sx={{ mb: 4, fontWeight: 700 }}>
                        My Flashcard Collections
                    </Typography>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                            <CircularProgress />
                        </Box>
                    ) : flashcards.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                                No flashcard collections yet
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                                Start by generating your first set of flashcards!
                            </Typography>
                            <Button 
                                variant="contained" 
                                size="large"
                                onClick={() => router.push('/generate')}
                            >
                                Generate Flashcards
                            </Button>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {flashcards.map((flashcard, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardActionArea 
                                            onClick={() => handleCardClick(flashcard.name)}
                                            sx={{ height: '100%', p: 2 }}
                                        >
                                            <CardContent>
                                                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                                                    {flashcard.name}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Container>
        </>
    )
}
