import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: ${(props) => props.theme.colors.cardBg};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
`;

// FIXED: Changed props.img to props.$img to fix the React warning
const ImageArea = styled.div`
  height: 160px;
  background-image: url(${(props) => props.$img});
  background-size: cover;
  background-position: center;
  background-color: ${(props) => props.theme.colors.secondary}; // Fallback
  position: relative;
`;

const Badge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: ${(props) => props.theme.colors.textDark};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Title = styled.h3`
  margin: 0 0 4px 0;
  color: ${(props) => props.theme.colors.textDark};
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SubText = styled.p`
  margin: 0 0 12px 0;
  color: ${(props) => props.theme.colors.textLight};
  font-size: 0.85rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const Price = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${(props) => props.theme.colors.primary};
`;

const ActionButton = styled.button`
  background: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e05e5e;
  }
`;

const ProductCard = ({ title, subtext, price, badge, img, btnText, onClick }) => {
  
  // Smart Price Formatter: Prevents "₹N/A" or "₹Menu inside"
  const formatPrice = (p) => {
    if (!p) return '';
    const pStr = String(p);
    if (pStr === 'N/A' || pStr.toLowerCase().includes('menu') || pStr.toLowerCase().includes('essentials')) {
      return pStr; // Return plain text without the rupee symbol
    }
    return pStr.startsWith('₹') ? pStr : `₹${pStr}`; // Add rupee symbol to numbers
  };

  return (
    <Card>
      {/* FIXED: Passed $img instead of img to prevent it from leaking into the DOM */}
      <ImageArea $img={img}>
        {badge && <Badge>{badge}</Badge>}
      </ImageArea>
      <Content>
        <Title>{title}</Title>
        <SubText>{subtext}</SubText>
        <PriceRow>
          <Price>{formatPrice(price)}</Price>
          <ActionButton onClick={onClick}>{btnText || 'Add'}</ActionButton>
        </PriceRow>
      </Content>
    </Card>
  );
};

export default ProductCard;