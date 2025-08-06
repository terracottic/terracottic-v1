import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const RFMScoreIndicator = ({ value, label }) => {
  const theme = useTheme();
  const getColor = (val) => {
    if (val >= 4) return theme.palette.success.main;
    if (val >= 3) return theme.palette.info.main;
    if (val >= 2) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ textAlign: 'center', p: 1 }}>
      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: getColor(value),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1rem',
          mx: 'auto',
          mb: 1
        }}
      >
        {value}
      </Box>
      <Typography variant="caption" color="textSecondary">
        {value === 5 ? 'Best' : value === 1 ? 'Worst' : ''}
      </Typography>
    </Box>
  );
};

const RFMScoreFilter = ({ label, value, onChange }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle2" gutterBottom>
      {label} Score: {value[0]} - {value[1]}
    </Typography>
    <Slider
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      valueLabelDisplay="auto"
      aria-labelledby="range-slider"
      min={1}
      max={5}
      step={1}
      marks={[
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
        { value: 5, label: '5' },
      ]}
      valueLabelFormat={(val) => val}
    />
  </Box>
);

const RFMAnalysis = ({ customers, filters, onFilterChange }) => {
  const theme = useTheme();

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'Champions': return theme.palette.success.main;
      case 'Loyal': return theme.palette.info.main;
      case 'Potential Loyalists': return theme.palette.primary.main;
      case 'Promising': return theme.palette.warning.main;
      case 'Needs Attention': return theme.palette.warning.dark;
      case 'At Risk': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Calculate RFM distribution
  const rfmDistribution = customers.reduce((acc, customer) => {
    const segment = customer.rfm.segment;
    const existing = acc.find(item => item.name === segment);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ 
        name: segment, 
        value: 1,
        color: getSegmentColor(segment)
      });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Filter customers based on RFM scores
  const filteredCustomers = customers.filter(customer => {
    return (
      customer.rfm.recency >= filters.recency[0] &&
      customer.rfm.recency <= filters.recency[1] &&
      customer.rfm.frequency >= filters.frequency[0] &&
      customer.rfm.frequency <= filters.frequency[1] &&
      customer.rfm.monetary >= filters.monetary[0] &&
      customer.rfm.monetary <= filters.monetary[1]
    );
  });

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>RFM Analysis</Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="recency" 
                    name="Recency" 
                    domain={[0.5, 5.5]}
                    label={{ value: 'Recency (1-5)', position: 'bottom' }}
                    ticks={[1, 2, 3, 4, 5]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="frequency" 
                    name="Frequency" 
                    domain={[0.5, 5.5]}
                    label={{ value: 'Frequency (1-5)', angle: -90, position: 'left' }}
                    ticks={[1, 2, 3, 4, 5]}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="monetary" 
                    range={[60, 400]} 
                    name="Monetary"
                  />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    formatter={(value, name, props) => {
                      if (name === 'Recency') return [value, 'Recency Score'];
                      if (name === 'Frequency') return [value, 'Frequency Score'];
                      if (name === 'Monetary') return [value, 'Monetary Score'];
                      return [value, name];
                    }}
                  />
                  <RechartsLegend />
                  <Scatter 
                    name="Customers" 
                    data={filteredCustomers.map(c => ({
                      ...c.rfm,
                      name: c.name,
                      email: c.email
                    }))} 
                    fill="#8884d8" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Customer RFM Scores</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell align="center">RFM Score</TableCell>
                    <TableCell align="center">Recency</TableCell>
                    <TableCell align="center">Frequency</TableCell>
                    <TableCell align="center">Monetary</TableCell>
                    <TableCell>Segment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: theme.palette.primary.main, 
                              mr: 2,
                              width: 32,
                              height: 32,
                              fontSize: '0.75rem'
                            }}
                          >
                            {customer.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{customer.name}</Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {customer.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={customer.rfm.totalScore} 
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <RFMScoreIndicator value={customer.rfm.recency} label="R" />
                      </TableCell>
                      <TableCell align="center">
                        <RFMScoreIndicator value={customer.rfm.frequency} label="F" />
                      </TableCell>
                      <TableCell align="center">
                        <RFMScoreIndicator value={customer.rfm.monetary} label="M" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={customer.rfm.segment} 
                          size="small" 
                          style={{ 
                            backgroundColor: getSegmentColor(customer.rfm.segment),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>RFM Filters</Typography>
            <Box sx={{ p: 2 }}>
              <RFMScoreFilter 
                label="Recency" 
                value={filters.recency} 
                onChange={(value) => onFilterChange('recency', value)} 
              />
              <RFMScoreFilter 
                label="Frequency" 
                value={filters.frequency} 
                onChange={(value) => onFilterChange('frequency', value)} 
              />
              <RFMScoreFilter 
                label="Monetary" 
                value={filters.monetary} 
                onChange={(value) => onFilterChange('monetary', value)} 
              />
              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel 
                  control={<Switch defaultChecked />} 
                  label="Show segment colors" 
                />
              </FormGroup>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>RFM Segments</Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { name: 'Champions', description: 'Bought recently, buy often and spend the most' },
                { name: 'Loyal', description: 'Buy often and spend good amounts' },
                { name: 'Potential Loyalists', description: 'Recent customers who spent good amounts' },
                { name: 'Promising', description: 'Recent customers with average frequency' },
                { name: 'Needs Attention', description: 'Above average recency, frequency & monetary values' },
                { name: 'At Risk', description: 'Spent big money and purchased often but long time ago' },
                { name: 'Hibernating', description: 'Low spenders who haven"t purchased lately' }
              ].map((segment) => (
                <Box 
                  key={segment.name} 
                  sx={{ 
                    p: 1.5, 
                    mb: 1, 
                    borderRadius: 1, 
                    bgcolor: 'action.hover',
                    borderLeft: `4px solid ${getSegmentColor(segment.name)}`
                  }}
                >
                  <Typography variant="subtitle2">{segment.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {segment.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Segment Distribution</Typography>
              <Tooltip title="Refresh">
                <IconButton size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rfmDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {rfmDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name, props) => [
                      `${value} customers`, 
                      props.payload.name
                    ]} 
                  />
                  <RechartsLegend 
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      paddingLeft: '20px',
                      maxWidth: '40%'
                    }}
                    formatter={(value, entry, index) => (
                      <span style={{ 
                        color: entry.color, 
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          backgroundColor: entry.color,
                          borderRadius: '2px'
                        }} />
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default RFMAnalysis;
