
import io
from notifications.models import Notification
from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from django.utils.html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentSerializer
from .permissions import IsPaymentStaffOrReadOnly


class PaymentViewSet(viewsets.ModelViewSet):

    serializer_class = PaymentSerializer

    permission_classes = [
        IsAuthenticated,
        IsPaymentStaffOrReadOnly,
    ]

    def get_queryset(self):
        user = self.request.user

        queryset = Payment.objects.select_related(
            "member",
            "membership",
            "membership__plan",
        )

        if user.role in ["ADMIN", "RECEPTIONIST"]:
            return queryset.all().order_by("-created_at")

        if user.role == "MEMBER":
            return queryset.filter(
                member=user
            ).order_by("-created_at")

        return queryset.none()

    def perform_create(self, serializer):
        member = serializer.validated_data["member"]
        membership = serializer.validated_data["membership"]
        amount = serializer.validated_data["amount"]

        if membership.member_id != member.id:
            raise ValidationError({
                "membership": (
                    "This membership does not belong to the selected member."
                )
            })

        if membership.status == "CANCELLED":
            raise ValidationError({
                "membership": (
                    "Payment cannot be recorded for a cancelled membership."
                )
            })

        if amount <= 0 or amount != membership.plan.price:
            raise ValidationError({
                "amount": (
                    "Payment amount must be positive and match "
                    "the membership plan price."
                )
            })

        if Payment.objects.filter(
            membership=membership,
            payment_status="SUCCESSFUL",
        ).exists():
            raise ValidationError({
                "membership": (
                    "This membership already has a successful payment."
                )
            })

        # Manual payments always begin as pending.
        serializer.save(
            payment_status="PENDING",
            payment_date=None,
        )

    
    @action(
        detail=True,
        methods=["post"],
        url_path="confirm",
    )
    @transaction.atomic
    def confirm(self, request, pk=None):
        payment = self.get_object()

        # Prevent confirming a payment twice.
        if payment.payment_status == "SUCCESSFUL":
            return Response(
                PaymentSerializer(payment).data
            )

        if payment.payment_status != "PENDING":
            raise ValidationError({
                "payment_status": (
                    "Only pending payments can be confirmed."
                )
            })

        membership = payment.membership

        if membership.member_id != payment.member_id:
            raise ValidationError({
                "membership": (
                    "This payment does not match the membership member."
                )
            })

        if membership.status == "CANCELLED":
            raise ValidationError({
                "membership": (
                    "A cancelled membership cannot be activated."
                )
            })

        now = timezone.now()

        payment.payment_status = "SUCCESSFUL"
        payment.payment_date = now
        payment.save(
            update_fields=["payment_status", "payment_date"]
        )

        membership.status = "ACTIVE"
        membership.amount_paid = payment.amount

        # Start the membership on the confirmation date.
        membership.start_date = timezone.localdate()
        membership.end_date = (
            membership.start_date
            + timezone.timedelta(
                days=membership.plan.duration_days - 1
            )
        )

        membership.save(
            update_fields=[
                "status",
                "amount_paid",
                "start_date",
                "end_date",
                "updated_at",
            ]
        )

        return Response(PaymentSerializer(payment).data)

    
    @action(
        detail=True,
        methods=["get"],
        url_path="receipt",
    )
    def receipt(self, request, pk=None):
        """Download a modern PDF receipt for a successful payment."""
        payment = self.get_object()

        if payment.payment_status != "SUCCESSFUL":
            raise ValidationError({
                "detail": "A receipt is available only for successful payments."
            })

        membership = payment.membership
        member = payment.member
        plan = membership.plan

        buffer = io.BytesIO()

        # SmartGym brand colors
        charcoal = colors.HexColor("#202522")
        lime = colors.HexColor("#C4F449")
        lime_dark = colors.HexColor("#365314")
        text_color = colors.HexColor("#263238")
        muted = colors.HexColor("#64748B")
        border = colors.HexColor("#E2E8F0")
        light_bg = colors.HexColor("#F8FAFC")
        white = colors.white

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
            title=f"SmartGym Payment Receipt {payment.pk}",
            author="SmartGym",
        )

        styles = getSampleStyleSheet()

        styles.add(ParagraphStyle(
            name="SGBrand",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=25,
            leading=29,
            alignment=TA_CENTER,
            textColor=charcoal,
            spaceAfter=3,
        ))

        styles.add(ParagraphStyle(
            name="SGSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            alignment=TA_CENTER,
            textColor=muted,
        ))

        styles.add(ParagraphStyle(
            name="SGSection",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=charcoal,
            spaceBefore=2,
            spaceAfter=7,
        ))

        styles.add(ParagraphStyle(
            name="SGLabel",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=muted,
        ))

        styles.add(ParagraphStyle(
            name="SGValue",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=text_color,
            wordWrap="CJK",
        ))

        styles.add(ParagraphStyle(
            name="SGSmall",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            textColor=muted,
        ))

        styles.add(ParagraphStyle(
            name="SGAmountLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=lime,
        ))

        styles.add(ParagraphStyle(
            name="SGAmount",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=25,
            leading=30,
            textColor=white,
            alignment=TA_RIGHT,
        ))

        styles.add(ParagraphStyle(
            name="SGStatus",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=lime_dark,
            alignment=TA_CENTER,
        ))

        styles.add(ParagraphStyle(
            name="SGFooter",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=charcoal,
        ))

        receipt_number = f"SG-PAY-{payment.pk:06d}"

        full_name = (
            f"{member.first_name or ''} {member.last_name or ''}".strip()
            or member.username
        )

        def safe(value):
            """Escape dynamic values before rendering ReportLab paragraphs."""
            if value is None or value == "":
                value = "—"
            return escape(str(value))

        def format_date(value):
            return value.strftime("%d %b %Y") if value else "—"

        def format_datetime(value):
            if not value:
                return "—"
            return timezone.localtime(value).strftime(
                "%d %b %Y, %I:%M %p"
            )

        def detail_table(rows, label_width=43 * mm, value_width=124 * mm):
            data = [
                [
                    Paragraph(f"<b>{safe(label)}</b>", styles["SGLabel"]),
                    Paragraph(safe(value), styles["SGValue"]),
                ]
                for label, value in rows
            ]

            table = Table(
                data,
                colWidths=[label_width, value_width],
                hAlign="LEFT",
            )
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), light_bg),
                ("BACKGROUND", (1, 0), (1, -1), white),
                ("BOX", (0, 0), (-1, -1), 0.6, border),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, border),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]))
            return table

        story = [
            # Brand header
            Paragraph("SMARTGYM", styles["SGBrand"]),
            Paragraph(
                "PAYMENT RECEIPT  •  OFFICIAL TRANSACTION RECORD",
                styles["SGSubtitle"],
            ),
            Spacer(1, 7 * mm),
        ]

        # Receipt number and successful payment badge
        header_table = Table(
            [[
                [
                    Paragraph("RECEIPT NUMBER", styles["SGLabel"]),
                    Spacer(1, 2),
                    Paragraph(
                        f"<b>{safe(receipt_number)}</b>",
                        styles["SGValue"],
                    ),
                ],
                Paragraph("✓  PAYMENT SUCCESSFUL", styles["SGStatus"]),
            ]],
            colWidths=[105 * mm, 62 * mm],
            hAlign="LEFT",
        )
        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), light_bg),
            ("BACKGROUND", (1, 0), (1, 0), lime),
            ("BOX", (0, 0), (-1, -1), 0.6, border),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (1, 0), (1, 0), "CENTER"),
            ("LEFTPADDING", (0, 0), (-1, -1), 11),
            ("RIGHTPADDING", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))

        story.extend([
            header_table,
            Spacer(1, 5 * mm),
        ])

        # Large amount-paid section
        amount_table = Table(
            [[
                [
                    Paragraph("TOTAL AMOUNT PAID", styles["SGAmountLabel"]),
                    Spacer(1, 5),
                    Paragraph(
                        f"INR {payment.amount:,.2f}",
                        styles["SGAmount"],
                    ),
                ]
            ]],
            colWidths=[167 * mm],
            hAlign="LEFT",
        )
        amount_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), charcoal),
            ("BOX", (0, 0), (-1, -1), 0.8, charcoal),
            ("LINEBEFORE", (0, 0), (0, 0), 5, lime),
            ("LEFTPADDING", (0, 0), (-1, -1), 15),
            ("RIGHTPADDING", (0, 0), (-1, -1), 15),
            ("TOPPADDING", (0, 0), (-1, -1), 13),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
        ]))

        story.extend([
            amount_table,
            Spacer(1, 5 * mm),
        ])

        # Transaction details
        transaction_rows = [
            ["Payment Date", format_datetime(payment.payment_date)],
            ["Payment Method", payment.get_payment_method_display()],
            ["Transaction ID", payment.transaction_id or "—"],
        ]

        story.extend([
            Paragraph("TRANSACTION DETAILS", styles["SGSection"]),
            detail_table(transaction_rows),
            Spacer(1, 5 * mm),
        ])

        # Member details
        member_rows = [
            ["Member Name", full_name],
            ["Username", member.username],
            ["Email", getattr(member, "email", "")],
            ["Phone", getattr(member, "phone", "")],
        ]

        story.extend([
            Paragraph("MEMBER DETAILS", styles["SGSection"]),
            detail_table(member_rows),
            Spacer(1, 5 * mm),
        ])

        # Membership details
        membership_rows = [
            ["Membership Plan", getattr(plan, "name", str(plan))],
            ["Membership ID", membership.pk],
            ["Start Date", format_date(membership.start_date)],
            ["End Date", format_date(membership.end_date)],
            ["Membership Status", membership.status],
        ]

        story.extend([
            Paragraph("MEMBERSHIP DETAILS", styles["SGSection"]),
            detail_table(membership_rows),
            Spacer(1, 8 * mm),
        ])

        # Footer
        footer_table = Table(
            [[
                Paragraph("THANK YOU FOR CHOOSING SMARTGYM!", styles["SGFooter"])
            ]],
            colWidths=[167 * mm],
        )
        footer_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), light_bg),
            ("LINEABOVE", (0, 0), (-1, 0), 2, lime),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))

        story.extend([
            footer_table,
            Spacer(1, 3 * mm),
            Paragraph(
                "This is a computer-generated receipt. "
                "Please retain it for your records.",
                ParagraphStyle(
                    name="SGReceiptFooterNote",
                    parent=styles["SGSmall"],
                    alignment=TA_CENTER,
                ),
            ),
        ])

        document.build(story)
        buffer.seek(0)

        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"{receipt_number}.pdf",
            content_type="application/pdf",
        )


    def perform_update(self, serializer):
        instance = self.get_object()

        if instance.payment_status == "SUCCESSFUL":
            raise ValidationError({
                "payment_status": (
                    "Successful payments cannot be modified."
                )
            })

        raise ValidationError({
            "detail": (
                "Use the payment confirmation action to confirm a payment. "
                "Create a new payment record if a correction is needed."
            )
        })

    def perform_destroy(self, instance):
        if instance.payment_status == "SUCCESSFUL":
            raise ValidationError({
                "payment": "Successful payment records cannot be deleted."
            })

        instance.delete()
