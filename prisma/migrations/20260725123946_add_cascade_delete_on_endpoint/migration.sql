-- DropForeignKey
ALTER TABLE "delivery_attempts" DROP CONSTRAINT "delivery_attempts_event_id_fkey";

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_endpoint_id_fkey";

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
