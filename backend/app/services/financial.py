class FinancialService:
    """
    Handles financial calculations for 'True ROI' analysis.
    Crucial for showing the real cost of acquisition, factoring in agency fees and operational costs.
    """

    def calculate_blended_metrics(self, ad_spend: float, fixed_costs: float, conversions: int, revenue: float = 0.0) -> dict:
        """
        Calculates the True CAC, Total Investment, and Blended ROAS.
        
        Args:
            ad_spend: Total amount spent on ads platform.
            fixed_costs: Agency fee, team salaries, tool subscriptions.
            conversions: Number of sales or leads.
            revenue: Total revenue generated (from pixel/conversion API).
        """
        total_investment = ad_spend + fixed_costs
        
        if conversions <= 0:
            true_cac = 0.0
        else:
            true_cac = total_investment / conversions
            
        # Basic Platform CAC (for comparison)
        platform_cac = (ad_spend / conversions) if conversions > 0 else 0.0

        # Blended ROAS (Revenue / Total Investment)
        blended_roas = (revenue / total_investment) if total_investment > 0 else 0.0
        
        # Profit
        profit = revenue - total_investment
        profit_margin = (profit / revenue * 100) if revenue > 0 else 0.0
        
        return {
            "total_investment": total_investment,
            "ad_spend": ad_spend,
            "fixed_costs": fixed_costs,
            "conversions": conversions,
            "revenue": revenue,
            "blended_roas": round(blended_roas, 2),
            "profit": round(profit, 2),
            "profit_margin": round(profit_margin, 1),
            "true_cac": round(true_cac, 2),
            "platform_cac": round(platform_cac, 2),
            "hidden_cost_percentage": round(((true_cac - platform_cac) / platform_cac) * 100, 1) if platform_cac > 0 else 0
        }

financial_service = FinancialService()
