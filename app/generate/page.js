'use client'

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Container, TextField, Box, Typography, Paper, Button, CardActionArea, CardContent, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Grid, CircularProgress, Alert, Snackbar } from '@mui/material'
import { useUser } from '@clerk/nextjs'
import { writeBatch, doc, collection, getDoc } from 'firebase/firestore'
import { db } from "@/firebase"
import Navigation from "../components/Navigation"

export default function Generate() {
    const { isLoaded, isSignedIn, user } = useUser()
    const [flashcards, setFlashcards] = useState([])
    const [flipped, setFlipped] = useState([])
    const [text, setText] = useState('')
    const [name, setName] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) {
            setError('Please enter some text to generate flashcards')
            return
        }
        setLoading(true)
        setError(null)
        try{
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: {"Content-Type": "text/plain"},
                body: text,
            });

            if (!res.ok){
                throw new Error(`Request failed with status ${res.status}`);
            }

            const data = await res.json();
            setFlashcards(data)
        } catch(err){
            console.error("Error generating flashcards", err)
            setError('Failed to generate flashcards. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleCardClick = (id) => {
        setFlipped((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    const handleOpen = () => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false)
    }

    const saveFlashcards = async () => {
        if (!name.trim()) {
            setSnackbar({ open: true, message: 'Please enter a name for your collection', severity: 'error' })
            return
        }

        try {
            const batch = writeBatch(db)
            const userDocRef = doc(collection(db, 'users'), user?.id)
            const docSnap = await getDoc(userDocRef)

            if (docSnap.exists()) {
                const collections = docSnap.data().flashcards || []
                if (collections.find((f) => f.name === name)) {
                    setSnackbar({ open: true, message: 'Flashcard collection with the same name already exists.', severity: 'error' })
                    return
                } else {
                    collections.push({ name })
                    batch.set(userDocRef, { flashcards: collections }, { merge: true })
                }
            } else {
                batch.set(userDocRef, { flashcards: [{ name }] })
            }

            const colRef = collection(userDocRef, name)
            flashcards.forEach((flashcard) => {
                const cardDocRef = doc(colRef)
                batch.set(cardDocRef, flashcard)
            })

            await batch.commit()
            handleClose()
            setSnackbar({ open: true, message: 'Flashcards saved successfully!', severity: 'success' })
            setTimeout(() => {
                router.push('/flashcards')
            }, 1000)
        } catch (error) {
            console.error('Error saving flashcards:', error)
            setSnackbar({ open: true, message: 'Failed to save flashcards. Please try again.', severity: 'error' })
        }
    }


    if (!isLoaded) {
        return (
            <>
                <Navigation />
                <Container maxWidth='md'>
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
            <Container maxWidth='lg'>
                <Box sx={{
                    mt: 4, mb: 6, display: 'flex', flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <Typography variant='h3' sx={{ mb: 4, fontWeight: 700 }}>
                        Generate Flashcards
                    </Typography>
                    <Paper sx={{ p: 4, width: '100%', maxWidth: 800 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            label='Enter Text'
                            placeholder='Paste or type your text here...'
                            fullWidth
                            multiline
                            rows={6}
                            variant='outlined'
                            sx={{
                                mb: 3
                            }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            disabled={loading}
                            fullWidth
                            sx={{ py: 1.5 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Flashcards'}
                        </Button>
                    </Paper>
                </Box>

            {flashcards.length > 0 && (
                <Box sx={{ mt: 6, mb: 6 }}>
                    <Typography variant='h4' sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
                        Flashcards Preview
                    </Typography>
                    <Grid container spacing={3}>
                        {flashcards.map((flashcard, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <CardActionArea 
                                    onClick={() => handleCardClick(index)}
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
                                                transform: flipped[index]
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
                    <Box sx={{
                        mt: 6,
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <Button 
                            variant='contained' 
                            size="large"
                            onClick={handleOpen}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            Save Collection
                        </Button>
                    </Box>
                </Box>
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Save Flashcards</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Please enter a name for your flashcards collection
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin='dense'
                        label='Collection Name'
                        type='text'
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        variant="outlined"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                saveFlashcards()
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={saveFlashcards} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
        </>
    )
}
