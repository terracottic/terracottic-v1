import { Box, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

// Floating animation
const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

// Rotating animation
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled components for the floating elements
const FloatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'size', 'left', 'top', 'blur', 'opacity', 'rotate', 'animationDuration'].includes(prop)
})(({ theme, delay, size, left, top, blur, opacity, rotate, animationDuration = '20s' }) => ({
  position: 'absolute',
  width: size,
  height: size,
  left: left,
  top: top,
  borderRadius: '50%',
  background: 'linear-gradient(45deg, rgba(139, 69, 19, 0.1), rgba(210, 105, 30, 0.2))',
  filter: `blur(${blur}px)`,
  opacity: opacity,
  animation: `${float} ${animationDuration} ease-in-out infinite`,
  animationDelay: `${delay}s`,
  transform: `rotate(${rotate}deg)`,
  zIndex: 0,
  pointerEvents: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const RotatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['size', 'right', 'bottom', 'color', 'opacity', 'animationDuration'].includes(prop)
})(({ theme, size, right, bottom, color, opacity, animationDuration = '60s' }) => ({
  position: 'absolute',
  width: size,
  height: size,
  right: right,
  bottom: bottom,
  borderRadius: '30%',
  border: `2px solid ${color}`,
  opacity: opacity,
  animation: `${rotate} ${animationDuration} linear infinite`,
  zIndex: 0,
  pointerEvents: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}));

const AnimatedBackground = () => {
  return (
    <>
      {/* Floating elements */}
      <FloatingShape size="200px" left="10%" top="20%" blur={10} opacity={0.4} delay={0} rotate={10} />
      <FloatingShape size="150px" left="80%" top="30%" blur={8} opacity={0.3} delay={2} rotate={-15} animationDuration="25s" />
      <FloatingShape size="100px" left="15%" top="70%" blur={6} opacity={0.2} delay={1} rotate={5} animationDuration="30s" />
      <FloatingShape size="180px" left="75%" top="60%" blur={12} opacity={0.3} delay={3} rotate={-10} animationDuration="35s" />
      
      {/* Rotating elements */}
      <RotatingShape size="300px" right="-100px" bottom="-100px" color="rgba(139, 69, 19, 0.1)" opacity={0.3} animationDuration="80s" />
      <RotatingShape size="400px" left="-150px" bottom="-150px" color="rgba(210, 105, 30, 0.1)" opacity={0.2} animationDuration="100s" />
      
      {/* Gradient overlay */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.8) 0%, rgba(245, 247, 250, 0.9) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
    </>
  );
};

export default AnimatedBackground;
