'use client'
import { useUser } from "@clerk/nextjs" 
import { useEffect, useState } from "react"
import {collection, doc, getDocs} from 'firebase/firestore'
import { db } from "@/firebase"
import { Container, Box, Typography, CardActionArea, CardContent, Grid, CircularProgress, Button } from '@mui/material'
import {useSearchParams, useRouter} from 'next/navigation'
import Navigation from "../components/Navigation"

export default function Flashcard() {
    const { isLoaded, isSignedIn, user } = useUser()
    const [flashcards, setFlashcards] = useState([])
    const [flipped, setFlipped] = useState({})
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const searchParams = useSearchParams()
    const search = searchParams.get('id')

    useEffect(() => {
        async function getFlashcard() {
            if (!search || !user) {
                setLoading(false)
                return
            }
            try {
                const docRef = collection(doc(collection(db, 'users'), user.id), search)
                const docSnap = await getDocs(docRef)
                const flashcardsData = []

                docSnap.forEach((doc) => {
                    flashcardsData.push({id: doc.id, ...doc.data()})
                })
                setFlashcards(flashcardsData)
            } catch (error) {
                console.error('Error fetching flashcard collection:', error)
            } finally {
                setLoading(false)
            }
        }
        getFlashcard()
    }, [user, search])

    const handleCardClick = (id) => {
        setFlipped((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

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

    return (
        <>
            <Navigation />
            <Container maxWidth="lg">
                <Box sx={{ mt: 4, mb: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {search || 'Flashcard Collection'}
                        </Typography>
                        <Button 
                            variant="outlined"
                            onClick={() => router.push('/flashcards')}
                        >
                            Back to Collections
                        </Button>
                    </Box>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                            <CircularProgress />
                        </Box>
                    ) : flashcards.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                                No flashcards in this collection
                            </Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {flashcards.map((flashcard, index) => (
                                <Grid item xs={12} sm={6} md={4} key={flashcard.id || index}>
                                    <CardActionArea 
                                        onClick={() => handleCardClick(flashcard.id || index)}
                                        sx={{ height: '100%' }}
                                    >
                                        <CardContent sx={{ p: 0 }}>
                                            <Box sx={{
                                                perspective: '1000px',
                                                height: '250px',
                                                '& > div': {
                                                    transition: 'transform 0.6s',
                                                    transformStyle: 'preserve-3d',
                                                    position: 'relative',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: 2,
                                                    transform: flipped[flashcard.id || index]
                                                        ? 'rotateY(180deg)'
                                                        : 'rotateY(0deg)',
                                                },
                                                '& > div > div': {
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    backfaceVisibility: 'hidden',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    padding: 3,
                                                    boxSizing: 'border-box',
                                                    borderRadius: 2,
                                                },
                                                '& > div > div:first-of-type': {
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                },
                                                '& > div > div:nth-of-type(2)': {
                                                    transform: 'rotateY(180deg)',
                                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                                    color: 'white',
                                                },
                                            }}>
                                                <div>
                                                    <div>
                                                        <Typography variant='h6' component='div' sx={{ textAlign: 'center', fontWeight: 600 }}>
                                                            {flashcard.front}
                                                        </Typography>
                                                    </div>
                                                    <div>
                                                        <Typography variant='body1' component='div' sx={{ textAlign: 'center' }}>
                                                            {flashcard.back}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Container>
        </>
    )
}