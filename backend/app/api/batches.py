from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Batch, Product, ProductStatus

router = APIRouter()


@router.get("/", summary="获取所有批次列表")
def list_batches(db: Session = Depends(get_db)):
    batches = db.query(Batch).order_by(Batch.created_at.desc()).all()
    result = []
    for b in batches:
        counts = db.query(Product.status, Product.id).filter(Product.batch_id == b.id).all()
        status_map = {}
        for s, _ in counts:
            status_map[s] = status_map.get(s, 0) + 1
        result.append({
            "id": b.id,
            "name": b.name,
            "total": b.total,
            "ready": status_map.get(ProductStatus.ready, 0),
            "uploaded": status_map.get(ProductStatus.uploaded, 0),
            "failed": status_map.get(ProductStatus.failed, 0),
            "processing": status_map.get(ProductStatus.ai_processing, 0),
            "created_at": b.created_at,
        })
    return result


@router.get("/{batch_id}/stats", summary="获取批次进度统计")
def batch_stats(batch_id: int, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.batch_id == batch_id).all()
    stats = {}
    for p in products:
        stats[p.status] = stats.get(p.status, 0) + 1
    return {"batch_id": batch_id, "total": len(products), "stats": stats}
