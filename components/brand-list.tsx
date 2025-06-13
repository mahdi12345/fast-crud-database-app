import { getBrands, deleteBrandAction } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { getSession } from "@/lib/auth-utils"
import { isModerator, isAdmin } from "@/lib/roles"

export default async function BrandList() {
  const brands = await getBrands()
  const session = await getSession()
  const canEdit = session ? await isModerator() : false
  const canDelete = session ? await isAdmin() : false

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Created At</TableHead>
            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit || canDelete ? 6 : 5} className="text-center py-8 text-muted-foreground">
                No brands found. {canEdit && "Add your first brand to get started."}
              </TableCell>
            </TableRow>
          ) : (
            brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.id}</TableCell>
                <TableCell>{brand.name}</TableCell>
                <TableCell className="max-w-xs truncate">{brand.description}</TableCell>
                <TableCell>
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {brand.website}
                    </a>
                  )}
                </TableCell>
                <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="text-right space-x-2">
                    {canEdit && (
                      <Link href={`/brands/${brand.id}/edit`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {canDelete && (
                      <form action={deleteBrandAction}>
                        <input type="hidden" name="brandId" value={brand.id} />
                        <Button variant="outline" size="icon" type="submit" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
