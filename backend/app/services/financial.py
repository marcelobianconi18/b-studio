class FinancialService:
    """
    Handles financial calculations for 'True ROI' analysis.
    Crucial for showing the real cost of acquisition, factoring in agency fees and operational costs.
    """

    def calculate_blended_metrics(self, ad_spend: float, fixed_costs: float, conversions: int) -> dict:
        """
        Calculates the True CAC (Customer Acquisition Cost) and Total Investment.
        
        Args:
            ad_spend: Total amount spent on ads platform.
            fixed_costs: Agency fee, team salaries, tool subscriptions.
            conversions: Number of sales or leads.
        """
        total_investment = ad_spend + fixed_costs
        
        if conversions <= 0:
            true_cac = 0.0
        else:
            true_cac = total_investment / conversions
            
        # Basic Platform CAC (for comparison)
        platform_cac = (ad_spend / conversions) if conversions > 0 else 0.0
        
        return {
            "total_investment": total_investment,
            "ad_spend": ad_spend,
            "fixed_costs": fixed_costs,
            "conversions": conversions,
            "true_cac": round(true_cac, 2),
            "platform_cac": round(platform_cac, 2),
            "hidden_cost_percentage": round(((true_cac - platform_cac) / platform_cac) * 100, 1) if platform_cac > 0 else 0
        }

financial_service = FinancialService()
