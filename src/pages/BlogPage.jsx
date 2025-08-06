import React from 'react';
import { Container, Typography, Box, Paper, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';

const BlogCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const BlogPage = () => {
  // Sample blog posts - in a real app, this would come from an API
  const blogPosts = [
    {
      id: 1,
      title: 'The Art of Terracotta: A Timeless Craft',
      excerpt: 'Explore the rich history and traditional techniques behind our handcrafted terracotta products.',
      date: 'August 1, 2024',
      image: 'https://images.unsplash.com/photo-1587351021112-16bafbc6abf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      category: 'Craftsmanship'
    },
    {
      id: 2,
      title: 'Sustainable Living with Terracotta',
      excerpt: 'Discover how terracotta products can help you lead a more sustainable and eco-friendly lifestyle.',
      date: 'July 25, 2024',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      category: 'Sustainability'
    },
    {
      id: 3,
      title: 'Cooking in Clay: Health Benefits',
      excerpt: 'Learn about the health benefits of cooking in traditional terracotta cookware.',
      date: 'July 15, 2024',
      image: 'https://images.unsplash.com/photo-1587351021112-16bafbc6abf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
      category: 'Health & Wellness'
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <ArticleIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
        <Typography variant="h4" component="h1">
          Our Blog
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {blogPosts.map((post) => (
          <Grid item key={post.id} xs={12} md={4}>
            <BlogCard>
              <CardMedia
                component="img"
                height="200"
                image={post.image}
                alt={post.title}
              />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="overline" color="primary" gutterBottom>
                  {post.category} • {post.date}
                </Typography>
                <Typography gutterBottom variant="h6" component="h2">
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {post.excerpt}
                </Typography>
                <Button 
                  component={Link}
                  to={`/blog/${post.id}`}
                  variant="outlined" 
                  color="primary"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Read More
                </Button>
              </CardContent>
            </BlogCard>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Button 
          variant="outlined" 
          color="primary"
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          View All Articles
        </Button>
      </Box>
    </Container>
  );
};

export default BlogPage;
